"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react";
import { loadWasmModule, processImageWithWasm } from "../lib/wasm-loader";
import { runFastStyleOnnx, type FastStyleId } from "../lib/onnx-style";

interface StyleTransferResult {
  success: boolean;
  message: string;
  processed_image_data?: string;
}

const styles = [
  {
    id: "vangogh",
    name: "Van Gogh",
    description: "Impressionist style with vibrant yellows and blues",
    color: "from-yellow-400 to-blue-500",
  },
  {
    id: "picasso",
    name: "Picasso",
    description: "Cubist style with geometric shapes and high contrast",
    color: "from-red-500 to-purple-600",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Futuristic style with neon colors and digital effects",
    color: "from-pink-500 to-cyan-400",
  },
  // ONNX fast styles
  {
    id: "onnx_udnie",
    name: "Udnie (ONNX)",
    description: "Fast neural style model",
    color: "from-indigo-500 to-blue-400",
  },
  {
    id: "onnx_candy",
    name: "Candy (ONNX)",
    description: "Fast neural style model",
    color: "from-pink-500 to-rose-400",
  },
  {
    id: "onnx_mosaic",
    name: "Mosaic (ONNX)",
    description: "Fast neural style model",
    color: "from-emerald-500 to-teal-400",
  },
];

export default function ImageStyleTransfer() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<StyleTransferResult | null>(null);
  const [wasmModule, setWasmModule] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load WebAssembly module
  useEffect(() => {
    const loadWasm = async () => {
      try {
        const module = await loadWasmModule();
        setWasmModule(module);
      } catch (error) {
        console.error("Failed to load WebAssembly module:", error);

        // Fallback to simulation for development
        console.log("Using simulated WebAssembly module for development");
        setWasmModule({
          process_image_style: async (imageData: Uint8Array, style: string) => {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return {
              success: true,
              message: `Successfully applied ${style} style (simulated)`,
              processed_image_data: imagePreview,
            };
          },
        });
      }
    };

    loadWasm();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    setResult(null);
  };

  const processImage = async () => {
    if (!selectedImage || !selectedStyle || !wasmModule) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // Convert image to Uint8Array
      const arrayBuffer = await selectedImage.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer);

      let result;

      if (selectedStyle.startsWith("onnx_")) {
        // Run ONNX Fast Neural Style
        const styleId = selectedStyle.replace("onnx_", "") as FastStyleId;
        const dataUrl = await runFastStyleOnnx(imagePreview, styleId);
        result = {
          success: true,
          message: `Successfully applied ${styleId} (ONNX)`,
          processed_image_data: dataUrl,
        };
      } else if (
        wasmModule.process_image_style &&
        typeof wasmModule.process_image_style === "function"
      ) {
        // Real WebAssembly module (Rust)
        result = await processImageWithWasm(
          wasmModule,
          imageData,
          selectedStyle
        );
      } else {
        // Fallback simulation
        result = await wasmModule.process_image_style(imageData, selectedStyle);
      }

      console.log("Final processing result:", result);
      setResult(result);
    } catch (error) {
      console.error("Error processing image:", error);
      setResult({
        success: false,
        message: "Failed to process image. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result?.processed_image_data) return;

    const link = document.createElement("a");
    link.href = result.processed_image_data;
    link.download = `style-transfer-${selectedStyle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setSelectedImage(null);
    setImagePreview("");
    setSelectedStyle("");
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Image Upload and Style Selection */}
        <div className="space-y-6">
          {/* Image Upload */}
          <div className="card animate-float">
            <h3 className="text-xl font-semibold text-white mb-4">
              Upload Image
            </h3>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-accent-500/50 hover:bg-white/5 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-200 mb-2">Click to upload an image</p>
                <p className="text-sm text-gray-400">Supports JPG, PNG, WebP</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg shadow-lifted"
                  />
                  <button
                    onClick={() => setImagePreview("")}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-300">
                  Selected: {selectedImage?.name}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Style Selection */}
          <div className="card animate-float">
            <h3 className="text-xl font-semibold text-white mb-4">
              Choose Style
            </h3>
            <div className="grid gap-3">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleStyleSelect(style.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all backdrop-blur ${
                    selectedStyle === style.id
                      ? "border-accent-500/70 bg-white/5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full bg-gradient-to-r ${style.color}`}
                    />
                    <div>
                      <h4 className="font-semibold text-white">{style.name}</h4>
                      <p className="text-sm text-gray-300">
                        {style.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Process Button */}
          <button
            onClick={processImage}
            disabled={!selectedImage || !selectedStyle || isProcessing}
            className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:shadow-[0_0_36px_rgba(59,130,246,0.55)]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Apply Style Transfer
              </>
            )}
          </button>

          {/* Reset Button */}
          <button onClick={resetAll} className="w-full btn-secondary">
            Reset All
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <div className="card animate-float">
            <h3 className="text-xl font-semibold text-white mb-4">Results</h3>

            {!result && !isProcessing && (
              <div className="text-center py-12 text-gray-400">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Upload an image and select a style to see results</p>
              </div>
            )}

            {isProcessing && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-accent-500 animate-spin" />
                <p className="text-lg font-medium text-gray-200">
                  Processing your image...
                </p>
                <p className="text-gray-400">This may take a few seconds</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-rose-500/15 text-rose-300"
                  }`}
                >
                  <p className="font-medium">{result.message}</p>
                </div>

                {result.success && result.processed_image_data && (
                  <>
                    <div className="relative">
                      <img
                        src={result.processed_image_data}
                        alt="Processed result"
                        className="w-full h-64 object-cover rounded-lg shadow-lifted"
                      />
                    </div>

                    <button
                      onClick={downloadResult}
                      className="w-full btn-primary flex items-center justify-center gap-2 animate-glow"
                    >
                      <Download className="w-5 h-5" />
                      Download Result
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* WebAssembly Status */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">WebAssembly Module</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    wasmModule
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {wasmModule ? "Loaded" : "Loading..."}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Image Processing</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isProcessing
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isProcessing ? "Active" : "Ready"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
