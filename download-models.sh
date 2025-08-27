#!/bin/bash

# Download additional Fast Neural Style ONNX models
# This script downloads popular Fast Neural Style models

MODELS_DIR="frontend/public/models/fast-style"

# Create models directory if it doesn't exist
mkdir -p "$MODELS_DIR"

echo "Downloading Fast Neural Style models..."

# Array of model URLs and names
declare -A models=(
    ["rain-princess.onnx"]="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/rain-princess-9.onnx"
    ["pointilism.onnx"]="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/pointilism-8.onnx"
)

# Download each model
for model_name in "${!models[@]}"; do
    url="${models[$model_name]}"
    output_path="$MODELS_DIR/$model_name"
    
    echo "Downloading $model_name..."
    
    if curl -L -o "$output_path" "$url"; then
        echo "✓ Downloaded $model_name"
    else
        echo "✗ Failed to download $model_name"
        echo "You may need to manually download this model from: $url"
    fi
done

echo "Download complete!"
echo "Models saved to: $MODELS_DIR"
