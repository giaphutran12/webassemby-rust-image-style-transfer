# Image Style Transfer with WebAssembly & Rust

A modern web application that transforms images using AI-powered style transfer, built with Next.js, WebAssembly, and Rust.

## Features

- 🎨 **5 Art Styles**: ONNX fast neural style models including:
  - **Udnie**: Abstract artistic style
  - **Candy**: Vibrant candy-like colors
  - **Mosaic**: Geometric mosaic patterns
  - **Rain Princess**: Romantic painterly style
  - **Pointilism**: Pointillist painting style
- 🔍 **1 Computer Vision Model**: Adversarial Inception v3 for image classification
- ⚡ **High Performance**: Image processing powered by WebAssembly and Rust
- 🖼️ **Multiple Formats**: Support for JPG, PNG, and WebP images
- 📱 **Responsive Design**: Beautiful UI that works on all devices
- 🚀 **Real-time Processing**: See your images transform instantly

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Rust with WebAssembly
- **Image Processing**: Rust image crate with custom style algorithms
- **Build Tools**: wasm-pack, Cargo

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://rustup.rs/) (latest stable version)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/) (for building WebAssembly)

## Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd webassembly-image-transfer
   ```

2. **Install Rust dependencies**

   ```bash
   # Install wasm-pack globally
   cargo install wasm-pack

   # Install Rust target for WebAssembly
   rustup target add wasm32-unknown-unknown
   ```

3. **Install Node.js dependencies**

   ```bash
   npm install
   ```

4. **Download ONNX Style Models**

   ```bash
   # On Windows (PowerShell)
   .\download-models.ps1

   # On Unix/Linux/macOS
   chmod +x download-models.sh
   ./download-models.sh
   ```

5. **Build the WebAssembly module**
   ```bash
   npm run build:wasm
   ```

## Development

1. **Start the development server**

   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Building for Production

1. **Build the WebAssembly module**

   ```bash
   npm run build:wasm
   ```

2. **Build the frontend**

   ```bash
   npm run build:frontend
   ```

3. **Start the production server**
   ```bash
   npm run start
   ```

## Project Structure

```
webassembly-image-transfer/
├── frontend/                 # Next.js React application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── public/models/       # ONNX models
│   │   ├── fast-style/     # 5 Fast Neural Style models
│   │   └── computer-vision/ # 1 Computer Vision model
│   └── package.json        # Frontend dependencies
├── rust-backend/            # Rust code for WASM compilation
│   ├── src/                # Rust source code
│   └── Cargo.toml         # Rust dependencies
├── wasm/                    # Compiled WebAssembly files
├── download-models.ps1     # Windows model download script
├── download-models.sh      # Unix/Linux model download script
└── package.json            # Root workspace configuration
```

## How It Works

1. **Image Upload**: Users upload images through a drag-and-drop interface
2. **Style Selection**: Choose from ONNX fast neural style models
3. **WebAssembly Processing**: Images are sent to Rust-compiled WebAssembly modules
4. **Style Application**: Custom algorithms apply artistic transformations
5. **Result Display**: Processed images are displayed with download options

## Style Algorithms

The application uses ONNX fast neural style models for instant image transformations. These models provide high-quality artistic style transfer with optimized performance.

## Customization

### Adding New Styles

1. Add a new style function in `rust-backend/src/lib.rs`
2. Update the style matching logic
3. Add the style to the frontend styles array
4. Test with various image types

### Modifying Existing Styles

- Edit the style functions in the Rust backend
- Rebuild the WebAssembly module
- Test the changes in the frontend

## Performance Considerations

- **Image Size**: Larger images take longer to process
- **WebAssembly Loading**: Initial load time for WASM modules
- **Memory Usage**: Image processing can be memory-intensive
- **Browser Compatibility**: Ensure WebAssembly support

## Troubleshooting

### Common Issues

1. **WebAssembly not loading**

   - Check if wasm-pack is installed
   - Verify Rust target is added
   - Check browser console for errors

2. **Image processing fails**

   - Ensure image format is supported
   - Check image file size
   - Verify WebAssembly module is loaded

3. **Build errors**
   - Update Rust to latest stable version
   - Clear cargo cache: `
