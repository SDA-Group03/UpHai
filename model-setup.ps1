# ===================================================
# Quick Setup Script - Pull Models to Volume (Windows)
# ===================================================

param(
    [string]$VolumeName = "ollama-models",
    [string[]]$Models = @("qwen:0.5b")
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setup Ollama Models" -ForegroundColor Cyan
Write-Host "----------------------------------------------" -ForegroundColor Gray
Write-Host "📦 Volume: $VolumeName"
Write-Host "📋 Models: $($Models -join ', ')"
Write-Host ""

# 1. Create Volume
Write-Host "1. Checking Docker volume..." -ForegroundColor Yellow
try {
    docker volume inspect $VolumeName | Out-Null
    Write-Host "   OK: Volume '$VolumeName' already exists." -ForegroundColor Green
} catch {
    docker volume create $VolumeName
    Write-Host "   OK: Created new volume." -ForegroundColor Green
}

# 2. Run temporary container
Write-Host ""
Write-Host "2. Running temporary container..." -ForegroundColor Yellow
docker run -d --name ollama-setup `
    -v "${VolumeName}:/root/.ollama" `
    ollama/ollama

Write-Host "   Waiting for service (5s)..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 3. Pull models
Write-Host ""
Write-Host "3. Pulling models..." -ForegroundColor Yellow
foreach ($model in $Models) {
    Write-Host "   Downloading $model..." -ForegroundColor Cyan
    docker exec ollama-setup ollama pull $model
    Write-Host "   Success: $model is ready." -ForegroundColor Green
}

# 4. Cleanup
Write-Host ""
Write-Host "4. Cleaning up..." -ForegroundColor Yellow
docker stop ollama-setup | Out-Null
docker rm ollama-setup | Out-Null
Write-Host "   OK: Temporary container removed." -ForegroundColor Green

# 5. Summary
Write-Host ""
Write-Host "----------------------------------------------" -ForegroundColor Gray
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Available Models in Volume:" -ForegroundColor White

$modelsOutput = docker run --rm -v "${VolumeName}:/data" busybox `
    ls /data/models/manifests/registry.ollama.ai/library 2>$null

if ($modelsOutput) {
    $modelsOutput -split "`n" | ForEach-Object {
        if ($_.Trim()) {
            Write-Host "   - $($_.Trim())" -ForegroundColor Cyan
        }
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Add Binds: ['${VolumeName}:/root/.ollama:ro'] to your Node.js code."
Write-Host "   2. Remove the 'pull model' logic from your app."
Write-Host "   3. Run: await createChatInstance('qwen:0.5b')"
Write-Host ""