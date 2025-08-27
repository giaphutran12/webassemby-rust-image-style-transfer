# Fast Neural Style Models

This project includes 5 pre-trained Fast Neural Style models for artistic style transfer.

## Available Styles

### 1. **Udnie**

- **File**: `udnie.onnx`
- **Style**: Abstract artistic style with flowing, organic forms
- **Best for**: Abstract art, modern compositions

### 2. **Candy**

- **File**: `candy.onnx`
- **Style**: Vibrant, candy-like colors with smooth gradients
- **Best for**: Bright, colorful images, candy photography

### 3. **Mosaic**

- **File**: `mosaic.onnx`
- **Style**: Geometric mosaic patterns with angular shapes
- **Best for**: Architectural photos, geometric subjects

### 4. **Rain Princess**

- **File**: `rain-princess.onnx`
- **Style**: Romantic, painterly style with soft brushstrokes
- **Best for**: Portraits, romantic scenes, soft aesthetics

### 5. **Pointilism**

- **File**: `pointilism.onnx`
- **Style**: Pointillist painting style with dot patterns
- **Best for**: Artistic portraits, impressionist scenes

## Downloading Models

### Automatic Download (Recommended)

**Windows (PowerShell):**

```powershell
.\download-models.ps1
```

**Unix/Linux/macOS:**

```bash
chmod +x download-models.sh
./download-models.sh
```

### Manual Download

If the automatic download fails, you can manually download the models from the ONNX Model Zoo:

1. Visit: https://github.com/onnx/models/tree/main/validated/vision/style_transfer/fast_neural_style/model
2. Download the following files:
   - `rain-princess-9.onnx` → rename to `rain-princess.onnx`
   - `pointilism-8.onnx` → rename to `pointilism.onnx`
3. Place them in `frontend/public/models/fast-style/`

## Model Specifications

- **Format**: ONNX (Open Neural Network Exchange)
- **Input Size**: 224x224 pixels (automatically resized)
- **Input Format**: RGB images (JPG, PNG, WebP)
- **Output Format**: PNG with applied style
- **Processing**: Client-side using ONNX Runtime Web

## Troubleshooting

### Model Loading Errors

If you see errors like "Failed to load style model", check:

1. **File Exists**: Ensure the `.onnx` file is in the correct directory
2. **File Size**: Each model should be approximately 6-7MB
3. **File Permissions**: Ensure the web server can read the files
4. **Network**: Check browser console for CORS or network errors

### Performance Issues

- **Large Images**: Very large images may cause memory issues
- **Browser Support**: Ensure your browser supports WebAssembly
- **Device Performance**: Style transfer is CPU-intensive

## Custom Models

You can add your own Fast Neural Style models by:

1. Converting your PyTorch model to ONNX format
2. Placing the `.onnx` file in `frontend/public/models/fast-style/`
3. Adding the style ID to the `FastStyleId` type in `frontend/lib/onnx-style.ts`
4. Adding the style to the UI in `frontend/components/ImageStyleTransfer.tsx`

## Technical Details

- **Framework**: Fast Neural Style (PyTorch → ONNX)
- **Architecture**: Convolutional Neural Network
- **Training**: Style transfer on various artistic styles
- **Inference**: Real-time processing in the browser
- **Memory**: ~50-100MB per model (loaded on-demand)
