#!/bin/bash

# ===================================================
# Complete Model Setup - All Engines
# ===================================================
# Sets up shared volumes and pulls models for:
# - Ollama (LLM)
# - Whisper (Speech-to-Text)
# - Stable Diffusion (Image Generation)
# ===================================================

set -e

echo "🚀 Voke Model Setup - All Engines"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ===================================================
# 1. OLLAMA MODELS
# ===================================================
echo ""
echo "📦 [1/3] Setting up Ollama Models..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

OLLAMA_VOLUME="ollama-models"
OLLAMA_MODELS=(
  "qwen2:0.5b"
)

# Create volume
if docker volume inspect "$OLLAMA_VOLUME" &>/dev/null; then
  echo "✅ Volume '$OLLAMA_VOLUME' exists"
else
  docker volume create "$OLLAMA_VOLUME"
  echo "✅ Created volume '$OLLAMA_VOLUME'"
fi

# Pull models
echo "Starting temporary Ollama container..."
docker run -d --name ollama-setup \
  -v "$OLLAMA_VOLUME:/root/.ollama" \
  ollama/ollama

sleep 5

for model in "${OLLAMA_MODELS[@]}"; do
  echo "📥 Pulling $model..."
  docker exec ollama-setup ollama pull "$model" || echo "⚠️  Failed to pull $model"
done

docker stop ollama-setup >/dev/null 2>&1
docker rm ollama-setup >/dev/null 2>&1
echo "✅ Ollama setup complete"

# ===================================================
# 2. WHISPER MODELS
# ===================================================
echo ""
echo "🎤 [2/3] Setting up Whisper Models..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WHISPER_VOLUME="whisper-models"

# Create volume
if docker volume inspect "$WHISPER_VOLUME" &>/dev/null; then
  echo "✅ Volume '$WHISPER_VOLUME' exists"
else
  docker volume create "$WHISPER_VOLUME"
  echo "✅ Created volume '$WHISPER_VOLUME'"
fi

# Pre-download Whisper models using Python
echo "📥 Downloading Whisper models..."
docker run --rm \
  -v "$WHISPER_VOLUME:/models" \
  python:3.11-slim bash -c "
    pip install -q openai-whisper && \
    python -c '
import whisper
import os
os.environ[\"WHISPER_CACHE\"] = \"/models\"
for model in [\"tiny\"]:
    print(f\"Downloading {model}...\")
    whisper.load_model(model, download_root=\"/models\")
    print(f\"✅ {model} ready\")
'
" || echo "⚠️  Whisper setup failed (will download on first use)"

echo "✅ Whisper setup complete"

# ===================================================
# 3. STABLE DIFFUSION MODELS
# ===================================================
echo ""
echo "🎨 [3/3] Setting up Stable Diffusion Models..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SD_VOLUME="sd-models"

# Create volume
if docker volume inspect "$SD_VOLUME" &>/dev/null; then
  echo "✅ Volume '$SD_VOLUME' exists"
else
  docker volume create "$SD_VOLUME"
  echo "✅ Created volume '$SD_VOLUME'"
fi

# Download SD models (using huggingface-cli)
echo "📥 Downloading Stable Diffusion models..."
docker run --rm \
  -v "$SD_VOLUME:/models" \
  python:3.11-slim bash -c "
    pip install -q huggingface-hub && \
    python -c '
from huggingface_hub import snapshot_download
import os

models = [
    (\"stabilityai/sd-turbo\"),
    (),
]

for repo, name in models:
    try:
        print(f\"📥 Downloading {name}...\")
        snapshot_download(
            repo_id=repo,
            local_dir=f\"/models/{name}\",
            local_dir_use_symlinks=False
        )
        print(f\"✅ {name} ready\")
    except Exception as e:
        print(f\"⚠️  {name} failed: {e}\")
'
" || echo "⚠️  SD setup failed (will download on first use)"

echo "✅ Stable Diffusion setup complete"

# ===================================================
# SUMMARY
# ===================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All Models Setup Complete!"
echo ""
echo "📊 Volume Summary:"
echo "   • $OLLAMA_VOLUME   - Ollama LLM models"
echo "   • $WHISPER_VOLUME  - Whisper STT models"
echo "   • $SD_VOLUME       - Stable Diffusion models"
echo ""
echo "💾 Total Space Used:"
docker system df -v | grep -E "(ollama|whisper|sd)-models" || echo "   Run 'docker system df -v' to check"
echo ""
echo "💡 Next Steps:"
echo "   1. Update services to use these volumes"
echo "   2. Set mount as read-only: 'volume:/path:ro'"
echo "   3. Remove model download logic from code"
echo "   4. Test container creation speed 🚀"
echo ""