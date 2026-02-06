#!/bin/bash
set -e
export MSYS_NO_PATHCONV=1

echo "🚀 Voke Model Setup - UpHai Engine"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function สำหรับเช็คไฟล์ใน Volume
check_volume_content() {
  docker run --rm -v "$1:/check" busybox ls -A /check | grep -q "."
}

# 1. OLLAMA SETUP
OLLAMA_VOLUME="ollama-models"
echo "📦 [1/3] Engine: Ollama"
if docker volume inspect $OLLAMA_VOLUME &>/dev/null && check_volume_content $OLLAMA_VOLUME; then
    echo "✅ Models already exist in $OLLAMA_VOLUME. Skipping..."
else
    docker volume create $OLLAMA_VOLUME >/dev/null 2>&1
    docker run -d --name ollama-setup -v "$OLLAMA_VOLUME:/root/.ollama" ollama/ollama
    echo "⏳ Waiting for Ollama server..."
    until docker exec ollama-setup ollama list >/dev/null 2>&1; do sleep 2; done
    
    echo "📥 Pulling Qwen2.5:0.5b..."
    docker exec ollama-setup ollama pull qwen2.5:0.5b
    docker stop ollama-setup && docker rm ollama-setup
    echo "✅ Ollama setup complete."
fi

# 2. WHISPER SETUP
WHISPER_VOLUME="whisper-models"
echo "🎤 [2/3] Engine: Faster-Whisper"
if docker volume inspect $WHISPER_VOLUME &>/dev/null && check_volume_content $WHISPER_VOLUME; then
    echo "✅ Models already exist in $WHISPER_VOLUME. Skipping..."
else
    docker volume create $WHISPER_VOLUME >/dev/null 2>&1
    docker run --rm -v "$WHISPER_VOLUME:/root/.cache/whisper" python:3.11-slim \
        sh -c "pip install -q openai-whisper && python -c 'import whisper; whisper.load_model(\"tiny\")'"
    echo "✅ Whisper setup complete."
fi

# 3. STABLE DIFFUSION SETUP
SD_VOLUME="sd-models"
echo "🎨 [3/3] Engine: SD-WebUI-Lite"
if docker volume inspect $SD_VOLUME &>/dev/null && check_volume_content $SD_VOLUME; then
    echo "✅ Models already exist in $SD_VOLUME. Skipping..."
else
    docker volume create $SD_VOLUME >/dev/null 2>&1
    docker run --rm -v "$SD_VOLUME:/models" python:3.11-slim \
        sh -c "pip install -q huggingface-hub && python -c 'from huggingface_hub import snapshot_download; snapshot_download(repo_id=\"segmind/tiny-sd\", local_dir=\"/models/tiny-sd\")'"
    echo "✅ Stable Diffusion setup complete."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All systems ready for UpHai!"
read -p "Press Enter to exit..."