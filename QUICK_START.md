# 🚀 Quick Start Guide

Get your Image Style Transfer app running in under 5 minutes!

## ⚡ Super Quick Start

### 1. Install Prerequisites

```bash
# Install Rust (if you don't have it)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Add WebAssembly target
rustup target add wasm32-unknown-unknown
```

### 2. Run the Project

```bash
# Install dependencies
npm install

# Build WebAssembly
npm run build:wasm

# Start development server
npm run dev
```

### 3. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 What You'll See

- **Beautiful UI**: Modern, responsive design with Tailwind CSS
- **Image Upload**: Drag & drop or click to upload images
- **Style Selection**: Choose from ONNX fast neural style models
- **Real-time Processing**: Watch your images transform with WebAssembly
- **Download Results**: Save your styled images

## 🔧 Troubleshooting

### Common Issues

**"Rust not found"**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

**"wasm-pack not found"**

```bash
cargo install wasm-pack
```

**"WebAssembly target not found"**

```bash
rustup target add wasm32-unknown-unknown
```

**"Build failed"**

```bash
# Clean and rebuild
cd rust-backend && cargo clean
npm run build:wasm
```

## 📱 Test the App

1. **Upload an image** (JPG, PNG, or WebP)
2. **Select a style** (ONNX fast neural style models)
3. **Click "Apply Style Transfer"**
4. **Wait for processing** (WebAssembly will handle this)
5. **Download your result**

## 🎨 Available Styles

- **ONNX Fast Models**: High-quality neural style transfer with optimized performance

## 🚀 Next Steps

- **Customize Styles**: Modify the Rust algorithms in `rust-backend/src/lib.rs`
- **Add New Styles**: Create new style transfer functions
- **Optimize Performance**: Improve the image processing algorithms
- **Deploy**: Build for production and deploy to your server

## 📚 Learn More

- Check out the [Development Guide](DEVELOPMENT.md) for detailed information
- Read the [README](README.md) for comprehensive documentation
- Explore the [Rust WebAssembly Book](https://rustwasm.github.io/book/)

## 🆘 Need Help?

- Check the browser console for errors
- Verify all prerequisites are installed
- Ensure you're using Node.js 18+ and Rust latest stable
- Try the demo script: `node demo.js`

---

**Happy Styling! 🎨✨**
