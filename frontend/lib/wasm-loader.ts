// WebAssembly loader utility for image style transfer

interface StyleTransferResult {
  success: boolean;
  message: string;
  processed_image_data?: string;
}

interface WasmModule {
  process_image_style: (imageData: Uint8Array, style: string) => any;
  greet: (name: string) => string;
}

let wasmModule: WasmModule | null = null;

export async function loadWasmModule(): Promise<WasmModule> {
  if (wasmModule) {
    return wasmModule;
  }

  try {
    console.log("Loading WebAssembly module...");

    // Try to load the real WebAssembly module
    console.log("Attempting to load real WebAssembly module...");

    // Load from public folder at runtime so webpack doesn't parse the .wasm
    // @ts-ignore
    const wasm = await import(
      /* webpackIgnore: true */
      `${window.location.origin}/wasm/image_style_transfer.js`
    );

    console.log("WebAssembly module imported successfully, initializing...");

    // Initialize the module - this loads the WASM file
    await wasm.default();

    console.log("WebAssembly module initialized successfully!");

    wasmModule = {
      process_image_style: wasm.process_image_style,
      greet: wasm.greet,
    };

    return wasmModule;
  } catch (error) {
    console.error("Failed to load WebAssembly module:", error);
    throw error;
  }
}

export async function processImageWithWasm(
  wasmModule: WasmModule,
  imageData: Uint8Array,
  style: string
): Promise<StyleTransferResult> {
  try {
    console.log(`Processing image with ${style} style using WebAssembly...`);
    console.log(`Image data size: ${imageData.length} bytes`);

    // Call the WebAssembly function (now async)
    const result = await wasmModule.process_image_style(imageData, style);

    console.log("Raw WASM result:", result);

    // The result should already be a JavaScript object due to serde-wasm-bindgen
    if (typeof result === "object" && result !== null) {
      return result as StyleTransferResult;
    }

    // Fallback: try to parse as JSON
    if (typeof result === "string") {
      return JSON.parse(result) as StyleTransferResult;
    }

    throw new Error("Unexpected result format from WebAssembly module");
  } catch (error) {
    console.error("Error processing image with WebAssembly:", error);
    return {
      success: false,
      message: `Failed to process image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
