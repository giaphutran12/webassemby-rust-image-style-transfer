# Image Style Transfer Build Script for Windows
# This script helps you build and run the project

Write-Host "🎨 Image Style Transfer - Build Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if Rust is installed
Write-Host "Checking Rust installation..." -ForegroundColor Yellow
try {
    $rustVersion = rustc --version
    Write-Host "✅ Rust found: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust not found. Please install Rust from https://rustup.rs/" -ForegroundColor Red
    exit 1
}

# Check if wasm-pack is installed
Write-Host "Checking wasm-pack installation..." -ForegroundColor Yellow
try {
    $wasmPackVersion = wasm-pack --version
    Write-Host "✅ wasm-pack found: $wasmPackVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  wasm-pack not found. Installing..." -ForegroundColor Yellow
    cargo install wasm-pack
}

# Add WebAssembly target
Write-Host "Adding WebAssembly target..." -ForegroundColor Yellow
rustup target add wasm32-unknown-unknown
Write-Host "✅ WebAssembly target added" -ForegroundColor Green

# Install Node.js dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Build WebAssembly module
Write-Host "Building WebAssembly module..." -ForegroundColor Yellow
npm run build:wasm
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ WebAssembly module built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to build WebAssembly module" -ForegroundColor Red
    exit 1
}

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build:frontend
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to build frontend" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To start the production server:" -ForegroundColor Cyan
Write-Host "  npm run start" -ForegroundColor White
Write-Host ""
Write-Host "Open your browser to http://localhost:3000" -ForegroundColor Cyan
