#!/bin/bash
set -e

# ==========================================
# 🚀 TURBO CONFIG (เน้นไว + มีหลอดโหลด)
# ==========================================

# 1. OLLAMA: Qwen2.5 (0.5B)
# Image: ollama/ollama
OLLAMA_MODEL="qwen2.5:0.5b"
OLLAMA_VOLUME="ollama-models"

# 2. WHISPER: Tiny (Direct Link)
# เรายิงตรงไปที่ OpenAI CDN เพื่อความไวสูงสุด
WHISPER_URL="https://openaipublic.azureedge.net/main/whisper/models/65147644a518d12f04e32d6f3b26facc3f8dd46e5390956a9424a650c0ce22b9/tiny.pt"
WHISPER_FILENAME="tiny.pt"
WHISPER_VOLUME="whisper-models"

# ==========================================
# 🛠️ SYSTEM CHECK
# ==========================================

echo "🚀 UpHai - Turbo Setup (Progress Bar Edition)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ensure_volume() {
    if docker volume inspect "$1" &>/dev/null; then
        echo "   📂 Found Volume: $1"
    else
        echo "   ✨ Creating Volume: $1"
        docker volume create "$1" >/dev/null
    fi
}

# ==========================================
# 🤖 1. OLLAMA (Interactive Pull)
# ==========================================
echo -e "\n🤖 [1/2] Setting up Ollama ($OLLAMA_MODEL)..."
ensure_volume $OLLAMA_VOLUME

# Start server in background
echo "   ⏳ Starting Ollama Engine..."
docker run -d --rm --name ollama-temp -v "$OLLAMA_VOLUME:/root/.ollama" ollama/ollama >/dev/null

# Wait for server ready (Check health)
until docker exec ollama-temp ollama list >/dev/null 2>&1; do sleep 1; done

# Pull with Progress Bar (ใช้ -it เพื่อบังคับโชว์หลอดโหลด)
echo "   ⬇️  Downloading Model (Please wait)..."
docker exec -it ollama-temp ollama pull "$OLLAMA_MODEL"

# Cleanup
docker stop ollama-temp >/dev/null
echo "   ✅ Ollama Ready!"


# ==========================================
# 👂 2. WHISPER (Direct Wget)
# ==========================================
echo -e "\n👂 [2/2] Setting up Whisper (Direct Download)..."
ensure_volume $WHISPER_VOLUME

# ใช้ Alpine + Wget (Image 5MB) โหลดไฟล์ตรงๆ 
# -O เพื่อระบุชื่อไฟล์ปลายทาง
# --show-progress เพื่อโชว์หลอดโหลด
echo "   ⬇️  Downloading $WHISPER_FILENAME from OpenAI CDN..."

docker run --rm -it -v "$WHISPER_VOLUME:/root/.cache/whisper" alpine sh -c "
    apk add --no-cache wget && \
    mkdir -p /root/.cache/whisper && \
    wget --show-progress -O /root/.cache/whisper/$WHISPER_FILENAME $WHISPER_URL
"

echo "   ✅ Whisper Ready!"

# ==========================================
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup Completed Successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"