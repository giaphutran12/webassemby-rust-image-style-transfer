# Development Guide

This guide will help you get started with developing the Image Style Transfer application.

## Quick Start

### 1. Prerequisites Installation

#### Install Rust

```bash
# Visit https://rustup.rs/ and follow the installation instructions
# Or run this command:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Install Node.js

```bash
# Visit https://nodejs.org/ and download the LTS version
# Or use nvm (Node Version Manager):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

#### Install wasm-pack

```bash
cargo install wasm-pack
```

### 2. Project Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd webassembly-image-transfer

# Install dependencies
npm install

# Add WebAssembly target
rustup target add wasm32-unknown-unknown
```

### 3. Development Workflow

#### Start Development Server

```bash
npm run dev
```

#### Build WebAssembly Module

```bash
npm run build:wasm
```

#### Build Frontend

```bash
npm run build:frontend
```

## Project Architecture

### Frontend (Next.js)

- **Location**: `frontend/`
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Components**: Modular React components

### Backend (Rust + WebAssembly)

- **Location**: `rust-backend/`
- **Language**: Rust
- **Target**: WebAssembly (wasm32-unknown-unknown)
- **Image Processing**: Custom algorithms for style transfer
- **Build Tool**: wasm-pack

### Key Components

#### ImageStyleTransfer Component

- Main component handling image upload and processing
- Manages WebAssembly module loading
- Handles user interactions and state

#### Rust Image Processing

- `apply_van_gogh_style()`: Impressionist style transformation
- `apply_picasso_style()`: Cubist style transformation
- `apply_cyberpunk_style()`: Futuristic style transformation

## Development Tips

### 1. Rust Development

- Use `cargo check` to check for compilation errors
- Use `cargo test` to run tests
- Use `cargo fmt` to format code
- Use `cargo clippy` for linting

### 2. WebAssembly Development

- Use `wasm-pack build --target web` for web builds
- Use `wasm-pack build --target nodejs` for Node.js builds
- Check browser console for WebAssembly loading errors
- Use browser dev tools to inspect WebAssembly modules

### 3. Frontend Development

- Use `npm run dev` for hot reloading
- Check browser console for JavaScript errors
- Use React DevTools for component debugging
- Use Tailwind CSS IntelliSense extension in VS Code

### 4. Image Processing

- Test with different image formats (JPG, PNG, WebP)
- Test with different image sizes
- Monitor memory usage during processing
- Optimize algorithms for performance

## Debugging

### Common Issues

#### WebAssembly Not Loading

```bash
# Check if wasm-pack is installed
wasm-pack --version

# Check if target is added
rustup target list | grep wasm32

# Check build output
npm run build:wasm
```

#### Image Processing Fails

- Check image format support
- Verify image file size
- Check browser console for errors
- Verify WebAssembly module is loaded

#### Build Errors

```bash
# Clean Rust build cache
cd rust-backend
cargo clean

# Reinstall wasm-pack
cargo install wasm-pack --force

# Check Rust version
rustc --version
```

### Debug Mode

Enable debug logging in the browser:

```javascript
localStorage.setItem("debug", "true");
```

## Testing

### Rust Tests

```bash
cd rust-backend
cargo test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing

1. Upload different image formats
2. Test all style options
3. Test with large images
4. Test error handling
5. Test responsive design

## Performance Optimization

### WebAssembly

- Optimize Rust algorithms
- Use efficient data structures
- Minimize memory allocations
- Profile with `cargo bench`

### Frontend

- Lazy load WebAssembly modules
- Optimize image uploads
- Use React.memo for components
- Implement proper loading states

### Image Processing

- Resize images before processing
- Use efficient pixel manipulation
- Implement progress indicators
- Cache processed results

## Deployment

### Build for Production

```bash
# Build WebAssembly
npm run build:wasm

# Build frontend
npm run build:frontend

# Start production server
npm run start
```

### Environment Variables

```bash
# Create .env.local
NEXT_PUBLIC_API_URL=your-api-url
NEXT_PUBLIC_WASM_PATH=/wasm/
```

### Server Requirements

- Node.js 18+
- WebAssembly support
- Static file serving
- HTTPS (for WebAssembly)

## Contributing

### Code Style

- Follow Rust formatting guidelines
- Use TypeScript strict mode
- Follow React best practices
- Use Tailwind CSS consistently

### Git Workflow

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

### Code Review

- Check for security issues
- Verify performance impact
- Ensure proper error handling
- Test edge cases

## Resources

### Documentation

- [Rust Book](https://doc.rust-lang.org/book/)
- [WebAssembly](https://webassembly.org/)
- [Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools

- [wasm-pack](https://rustwasm.github.io/wasm-pack/)
- [Rust Playground](https://play.rust-lang.org/)
- [WebAssembly Studio](https://webassembly.studio/)

### Community

- [Rust Community](https://www.rust-lang.org/community)
- [WebAssembly Community](https://webassembly.org/community/)
- [Next.js Community](https://nextjs.org/community)
