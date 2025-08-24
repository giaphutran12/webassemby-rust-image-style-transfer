// Demo script for Image Style Transfer
// This script demonstrates the basic functionality without building the full project

console.log("🎨 Image Style Transfer Demo");
console.log("============================");

// Simulate the WebAssembly module
const wasmModule = {
  process_image_style: async (imageData, style) => {
    console.log(`Processing image with ${style} style...`);
    console.log(`Image data size: ${imageData.length} bytes`);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate result
    return {
      success: true,
      message: `Successfully applied ${style} style`,
      processed_image_data: `data:image/png;base64,${btoa(
        "simulated_image_data"
      )}`,
    };
  },
};

// Demo function
async function runDemo() {
  console.log("\n🚀 Starting demo...\n");

  // Simulate image data (just a small array for demo)
  const mockImageData = new Uint8Array(1024);
  for (let i = 0; i < mockImageData.length; i++) {
    mockImageData[i] = Math.floor(Math.random() * 256);
  }

  const styles = ["vangogh", "picasso", "cyberpunk"];

  for (const style of styles) {
    console.log(`🎨 Testing ${style} style...`);

    try {
      const result = await wasmModule.process_image_style(mockImageData, style);
      console.log(`✅ ${result.message}`);
      console.log(
        `   Processed image data: ${result.processed_image_data.substring(
          0,
          50
        )}...`
      );
    } catch (error) {
      console.error(`❌ Error processing ${style} style:`, error);
    }

    console.log("");
  }

  console.log("🎉 Demo completed successfully!");
  console.log("\nTo run the full application:");
  console.log("1. Install dependencies: npm install");
  console.log("2. Build WebAssembly: npm run build:wasm");
  console.log("3. Start development server: npm run dev");
}

// Run the demo
runDemo().catch(console.error);
