#!/bin/bash

# Image Style Transfer Build Script for Unix/Linux
# This script helps you build and run the project

echo "🎨 Image Style Transfer - Build Script"
echo "====================================="

# Check if Rust is installed
echo "Checking Rust installation..."
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    echo "✅ Rust found: $RUST_VERSION"
else
    echo "❌ Rust not found. Please install Rust from https://rustup.rs/"
    exit 1
fi

# Check if wasm-pack is installed
echo "Checking wasm-pack installation..."
if command -v wasm-pack &> /dev/null; then
    WASM_PACK_VERSION=$(wasm-pack --version)
    echo "✅ wasm-pack found: $WASM_PACK_VERSION"
else
    echo "⚠️  wasm-pack not found. Installing..."
    cargo install wasm-pack
fi

# Add WebAssembly target
echo "Adding WebAssembly target..."
rustup target add wasm32-unknown-unknown
echo "✅ WebAssembly target added"

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install
echo "✅ Dependencies installed"

# Build WebAssembly module
echo "Building WebAssembly module..."
npm run build:wasm
if [ $? -eq 0 ]; then
    echo "✅ WebAssembly module built successfully"
else
    echo "❌ Failed to build WebAssembly module"
    exit 1
fi

# Build frontend
echo "Building frontend..."
npm run build:frontend
if [ $? -eq 0 ]; then
    echo "✅ Frontend built successfully"
else
    echo "❌ Failed to build frontend"
    exit 1
fi

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To start the production server:"
echo "  npm run start"
echo ""
echo "Open your browser to http://localhost:3000"
