export type FastStyleId = "udnie" | "candy" | "mosaic";

type SessionCache = Map<FastStyleId, any>;
const sessionCache: SessionCache = new Map();

function getModelUrl(style: FastStyleId): string {
  return `${window.location.origin}/models/fast-style/${style}.onnx`;
}

async function loadOrt(): Promise<any> {
  if (typeof window === "undefined") throw new Error("ORT must run in browser");
  const w = window as any;
  if (w.ort) return w.ort;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.min.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
  const ort = (window as any).ort;
  // Ensure WASM files resolve from CDN too
  ort.env.wasm.wasmPaths =
    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
  return ort;
}

async function getSession(style: FastStyleId): Promise<any> {
  const cached = sessionCache.get(style);
  if (cached) return cached;

  const ort = await loadOrt();
  // Use stable WASM first to avoid WebGPU init issues
  const providers: any[] = ["wasm"];

  const session = await ort.InferenceSession.create(getModelUrl(style), {
    executionProviders: providers,
  });
  sessionCache.set(style, session);
  return session;
}

function createLetterboxedCanvas(
  img: HTMLImageElement,
  targetW: number,
  targetH: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  // Background as blurred-like neutral: light gray
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, targetW, targetH);

  const scale = Math.min(
    targetW / img.naturalWidth,
    targetH / img.naturalHeight
  );
  const drawW = Math.round(img.naturalWidth * scale);
  const drawH = Math.round(img.naturalHeight * scale);
  const dx = Math.floor((targetW - drawW) / 2);
  const dy = Math.floor((targetH - drawH) / 2);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    img,
    0,
    0,
    img.naturalWidth,
    img.naturalHeight,
    dx,
    dy,
    drawW,
    drawH
  );
  return canvas;
}

function imageDataToCHWFloat32(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const out = new Float32Array(3 * width * height);
  let oR = 0;
  let oG = width * height;
  let oB = 2 * width * height;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    out[oR++] = r / 255;
    out[oG++] = g / 255;
    out[oB++] = b / 255;
  }
  return out;
}

function chwToImageData(
  chw: Float32Array,
  width: number,
  height: number
): ImageData {
  const out = new Uint8ClampedArray(width * height * 4);
  const planeSize = width * height;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < chw.length; i++) {
    const v = chw[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const scale = max - min === 0 ? 1 : 1 / (max - min);
  for (let p = 0, i = 0; p < planeSize; p++) {
    let r = chw[p];
    let g = chw[p + planeSize];
    let b = chw[p + 2 * planeSize];
    // Try common output ranges: [0,1], [-1,1], or arbitrary; normalize to [0,255]
    if (max <= 1.2 && min >= -0.2) {
      // assume [0,1] or ~
      r = Math.min(1, Math.max(0, r));
      g = Math.min(1, Math.max(0, g));
      b = Math.min(1, Math.max(0, b));
      out[i++] = r * 255;
      out[i++] = g * 255;
      out[i++] = b * 255;
      out[i++] = 255;
    } else if (max <= 1.1 && min >= -1.1) {
      // [-1,1]
      out[i++] = (r * 0.5 + 0.5) * 255;
      out[i++] = (g * 0.5 + 0.5) * 255;
      out[i++] = (b * 0.5 + 0.5) * 255;
      out[i++] = 255;
    } else {
      // normalize by observed min/max
      out[i++] = (r - min) * scale * 255;
      out[i++] = (g - min) * scale * 255;
      out[i++] = (b - min) * scale * 255;
      out[i++] = 255;
    }
  }
  return new ImageData(out, width, height);
}

export async function runFastStyleOnnx(
  imageSrc: string,
  style: FastStyleId
): Promise<string> {
  try {
    const session = await getSession(style);

    // Resolve input dimensions from model (default to 224x224 for Fast Neural Style)
    const inputName = session.inputNames[0];
    const inputMeta = session.inputMetadata[inputName];
    const dims = inputMeta?.dimensions as Array<number | string> | undefined;
    const H =
      Array.isArray(dims) && typeof dims[2] === "number" && dims[2] > 0
        ? dims[2]
        : 224;
    const W =
      Array.isArray(dims) && typeof dims[3] === "number" && dims[3] > 0
        ? dims[3]
        : 224;

    // Load image
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = (e) => reject(e);
      el.src = imageSrc;
    });

    // Letterbox + tensorize
    const canvas = createLetterboxedCanvas(img, W, H);
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const imageData = ctx.getImageData(0, 0, W, H);
    const chw = imageDataToCHWFloat32(imageData);

    const ort = await loadOrt();
    const input = new ort.Tensor("float32", chw, [1, 3, H, W]);
    const feeds: Record<string, any> = { [inputName]: input };

    const results = await session.run(feeds);
    const outputName = session.outputNames[0];
    const output = results[outputName] as any;

    // Convert back to ImageData
    const outChw = output.data as Float32Array;
    const outImage = chwToImageData(outChw, W, H);
    ctx.putImageData(outImage, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("ONNX fast style error:", reason);
    throw new Error(`ONNX failed: ${reason}`);
  }
}
