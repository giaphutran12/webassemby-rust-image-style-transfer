# Download additional Fast Neural Style ONNX models
$modelsDir = "frontend/public/models/fast-style"

# Create models directory if it doesn't exist
if (!(Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force
}

Write-Host "Downloading Fast Neural Style models..." -ForegroundColor Green

# Download each model
$models = @(
    @{name="rain-princess.onnx"; url="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/rain-princess-9.onnx"},
    @{name="pointilism.onnx"; url="https://github.com/onnx/models/raw/main/validated/vision/style_transfer/fast_neural_style/model/pointilism-8.onnx"}
)

# Download computer vision models
$computerVisionModels = @(
    @{name="adv-inception-v3.onnx"; url="https://github.com/onnx/models/raw/main/Computer_Vision/adv_inception_v3_Opset18_timm/adv_inception_v3_Opset18.onnx"}
)

foreach ($model in $models) {
    $outputPath = Join-Path $modelsDir $model.name
    Write-Host "Downloading $($model.name)..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $model.url -OutFile $outputPath
        Write-Host "Downloaded $($model.name)" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to download $($model.name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Download computer vision models
$computerVisionDir = "frontend/public/models/computer-vision"
if (!(Test-Path $computerVisionDir)) {
    New-Item -ItemType Directory -Path $computerVisionDir -Force
}

foreach ($model in $computerVisionModels) {
    $outputPath = Join-Path $computerVisionDir $model.name
    Write-Host "Downloading $($model.name)..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri $model.url -OutFile $outputPath
        Write-Host "Downloaded $($model.name)" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to download $($model.name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Download complete!" -ForegroundColor Green
Write-Host "Models saved to: $modelsDir" -ForegroundColor Cyan
