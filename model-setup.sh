#!/bin/bash

# Interactive Model Downloader
# Supports Ollama, Whisper, and Stable Diffusion models

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Docker volume paths
OLLAMA_VOLUME="ollama-models"
WHISPER_VOLUME="whisper-models"
SD_VOLUME="sd-models"

# Print colored header
print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║          🚀 AI Model Downloader v1.0                    ║"
    echo "║          Interactive Multi-Engine Model Manager         ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Print section header
print_section() {
    echo -e "\n${BOLD}${MAGENTA}▶ $1${NC}"
    echo -e "${MAGENTA}$(printf '─%.0s' {1..60})${NC}"
}

# Show progress with percentage
show_progress() {
    local current=$1
    local total=$2
    local description=$3
    local percentage=$((current * 100 / total))
    local filled=$((percentage / 2))
    local empty=$((50 - filled))
    
    printf "\r${CYAN}[${GREEN}"
    printf "%${filled}s" | tr ' ' '█'
    printf "${NC}"
    printf "%${empty}s" | tr ' ' '░'
    printf "${CYAN}]${NC} ${BOLD}%3d%%${NC} - %s" "$percentage" "$description"
}

# Complete progress bar
complete_progress() {
    echo -e "\r${CYAN}[${GREEN}$(printf '█%.0s' {1..50})${CYAN}]${NC} ${BOLD}${GREEN}100%${NC} - ✓ $1"
}

# Simulate download progress (for demonstration)
simulate_download() {
    local model_name=$1
    local steps=50
    
    for i in $(seq 1 $steps); do
        show_progress $i $steps "Downloading $model_name"
        sleep 0.05
    done
    complete_progress "$model_name downloaded successfully"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}✗ Error: Docker is not running${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is running${NC}"
}

# Check if volume exists
check_volume() {
    local volume=$1
    if docker volume inspect "$volume" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Volume '$volume' exists${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Volume '$volume' not found. Creating...${NC}"
        docker volume create "$volume"
        echo -e "${GREEN}✓ Volume '$volume' created${NC}"
        return 0
    fi
}

# Ollama model download
download_ollama_model() {
    local model_name=$1
    local display_name=$2
    
    echo -e "\n${BOLD}Downloading Ollama model: $display_name${NC}"
    echo -e "${YELLOW}Model: $model_name${NC}"
    
    # Run Ollama container temporarily to pull model
    docker run --rm \
        -v ${OLLAMA_VOLUME}:/root/.ollama \
        ollama/ollama \
        pull "$model_name"
    
    echo -e "${GREEN}✓ Successfully downloaded $display_name${NC}"
}

# Whisper model download
download_whisper_model() {
    local model_name=$1
    local display_name=$2
    
    echo -e "\n${BOLD}Downloading Whisper model: $display_name${NC}"
    echo -e "${YELLOW}Model: $model_name${NC}"
    
    # Download using faster-whisper-server
    docker run --rm \
        -v ${WHISPER_VOLUME}:/root/.cache/huggingface \
        fedirz/faster-whisper-server:latest-cpu \
        bash -c "python -c \"from faster_whisper import WhisperModel; WhisperModel('$model_name', device='cpu', compute_type='int8')\""
    
    echo -e "${GREEN}✓ Successfully downloaded $display_name${NC}"
}

# Stable Diffusion model download
download_sd_model() {
    local model_id=$1
    local display_name=$2
    
    echo -e "\n${BOLD}Downloading Stable Diffusion model: $display_name${NC}"
    echo -e "${YELLOW}Model: $model_id${NC}"
    
    # This would download SD models - adjust based on your SD setup
    echo -e "${CYAN}Note: SD model download requires specific implementation${NC}"
    echo -e "${YELLOW}Please manually configure SD model download for: $model_id${NC}"
}

# Display menu
show_menu() {
    local title=$1
    shift
    local options=("$@")
    
    echo -e "\n${BOLD}${CYAN}$title${NC}"
    echo -e "${CYAN}$(printf '─%.0s' {1..60})${NC}"
    
    for i in "${!options[@]}"; do
        echo -e "${YELLOW}  $((i+1)).${NC} ${options[$i]}"
    done
    echo -e "${CYAN}$(printf '─%.0s' {1..60})${NC}"
}

# Get user choice
get_choice() {
    local max=$1
    local choice
    
    while true; do
        echo -ne "${BOLD}${GREEN}Enter your choice (1-$max): ${NC}"
        read choice
        
        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "$max" ]; then
            echo "$choice"
            return 0
        else
            echo -e "${RED}Invalid choice. Please enter a number between 1 and $max${NC}"
        fi
    done
}

# Main menu
main_menu() {
    while true; do
        print_header
        
        show_menu "Select Engine" \
            "🤖 Ollama (Chat & Code Models)" \
            "🎤 Whisper (Audio Transcription)" \
            "🎨 Stable Diffusion (Image Generation)" \
            "📊 Show Volume Status" \
            "❌ Exit"
        
        choice=$(get_choice 5)
        
        case $choice in
            1) ollama_menu ;;
            2) whisper_menu ;;
            3) sd_menu ;;
            4) show_volume_status ;;
            5) 
                echo -e "\n${GREEN}Goodbye! 👋${NC}\n"
                exit 0
                ;;
        esac
    done
}

# Ollama model menu
ollama_menu() {
    print_section "Ollama Models (Lightweight Options)"
    
    show_menu "Select Model Size Category" \
        "🚀 Turbo/Nano (0.5B - 2B) - Ultra-fast, minimal resources" \
        "⚖️  Balanced (3B - 8B) - Good performance/efficiency balance" \
        "🎯 All Lightweight Models" \
        "⬅️  Back to Main Menu"
    
    choice=$(get_choice 4)
    
    case $choice in
        1) ollama_turbo_menu ;;
        2) ollama_balanced_menu ;;
        3) ollama_all_lightweight_menu ;;
        4) return ;;
    esac
}

# Ollama Turbo/Nano models
ollama_turbo_menu() {
    print_section "Turbo/Nano Models"
    
    show_menu "Select Model" \
        "Qwen 2 (0.5B) - 352 MB - Ultra-lightweight, blazingly fast" \
        "Qwen 2 (1.5B) - 934 MB - Efficient with better reasoning" \
        "Gemma (2B) - 1.4 GB - Google's compact model" \
        "CodeQwen (1.5B) - 900 MB - Lightweight coding specialist" \
        "⬅️  Back"
    
    choice=$(get_choice 5)
    
    case $choice in
        1) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "qwen2:0.5b" "Qwen 2 (0.5B)"
            ;;
        2) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "qwen2:1.5b" "Qwen 2 (1.5B)"
            ;;
        3) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "gemma:2b" "Gemma (2B)"
            ;;
        4) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "codeqwen:1.5b" "CodeQwen (1.5B)"
            ;;
        5) return ;;
    esac
    
    echo -e "\n${CYAN}Press Enter to continue...${NC}"
    read
}

# Ollama Balanced models
ollama_balanced_menu() {
    print_section "Balanced Models"
    
    show_menu "Select Model" \
        "Llama 3.2 (3B) - 2 GB - Meta's optimized model" \
        "Phi-3 (3.8B) - 2.3 GB - Microsoft's powerful small model" \
        "Mistral (7B) - 4.1 GB - Benchmark 7B model" \
        "Llama 3.1 (8B) - 4.7 GB - Enhanced with 128k context" \
        "DeepSeek Coder (6.7B) - 3.8 GB - Top-tier coding model" \
        "⬅️  Back"
    
    choice=$(get_choice 6)
    
    case $choice in
        1) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "llama3.2:3b" "Llama 3.2 (3B)"
            ;;
        2) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "phi3:3.8b" "Phi-3 (3.8B)"
            ;;
        3) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "mistral:7b" "Mistral (7B)"
            ;;
        4) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "llama3.1:8b" "Llama 3.1 (8B)"
            ;;
        5) 
            check_volume "$OLLAMA_VOLUME"
            download_ollama_model "deepseek-coder:6.7b" "DeepSeek Coder (6.7B)"
            ;;
        6) return ;;
    esac
    
    echo -e "\n${CYAN}Press Enter to continue...${NC}"
    read
}

# All lightweight Ollama models
ollama_all_lightweight_menu() {
    print_section "Download All Lightweight Models"
    
    echo -e "${YELLOW}This will download the following models:${NC}"
    echo -e "  • Qwen 2 (0.5B) - 352 MB"
    echo -e "  • Qwen 2 (1.5B) - 934 MB"
    echo -e "  • Gemma (2B) - 1.4 GB"
    echo -e "  • Llama 3.2 (3B) - 2 GB"
    echo -e "${BOLD}Total: ~4.7 GB${NC}"
    
    echo -ne "\n${GREEN}Continue? (y/n): ${NC}"
    read confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        check_volume "$OLLAMA_VOLUME"
        
        download_ollama_model "qwen2:0.5b" "Qwen 2 (0.5B)"
        download_ollama_model "qwen2:1.5b" "Qwen 2 (1.5B)"
        download_ollama_model "gemma:2b" "Gemma (2B)"
        download_ollama_model "llama3.2:3b" "Llama 3.2 (3B)"
        
        echo -e "\n${GREEN}${BOLD}✓ All lightweight models downloaded successfully!${NC}"
    fi
    
    echo -e "\n${CYAN}Press Enter to continue...${NC}"
    read
}

# Whisper menu
whisper_menu() {
    print_section "Whisper Models"
    
    show_menu "Select Model" \
        "Tiny - 75 MB - Ultra-fast, real-time transcription" \
        "Medium - 1.5 GB - High accuracy, professional use" \
        "Large v3 - 3.1 GB - State-of-the-art accuracy" \
        "⬅️  Back"
    
    choice=$(get_choice 4)
    
    case $choice in
        1) 
            check_volume "$WHISPER_VOLUME"
            download_whisper_model "tiny" "Whisper Tiny"
            ;;
        2) 
            check_volume "$WHISPER_VOLUME"
            download_whisper_model "medium" "Whisper Medium"
            ;;
        3) 
            check_volume "$WHISPER_VOLUME"
            download_whisper_model "large-v3" "Whisper Large v3"
            ;;
        4) return ;;
    esac
    
    echo -e "\n${CYAN}Press Enter to continue...${NC}"
    read
}

# Stable Diffusion menu
sd_menu() {
    print_section "Stable Diffusion Models"
    
    show_menu "Select Model" \
        "LCM LoRA - 800 MB - Ultra-fast generation" \
        "Playground v2 - 3.2 GB - Best aesthetics" \
        "SDXL Turbo - 6.9 GB - High-res real-time" \
        "⬅️  Back"
    
    choice=$(get_choice 4)
    
    case $choice in
        1|2|3) 
            echo -e "\n${YELLOW}Stable Diffusion download not yet implemented${NC}"
            echo -e "${CYAN}Please configure SD model download manually${NC}"
            ;;
        4) return ;;
    esac
    
    echo -e "\n${CYAN}Press Enter to continue...${NC}"
    read
}

# Show volume status
show_volume_status() {
    print_section "Docker Volume Status"
    
    echo -e "${BOLD}Checking volumes...${NC}\n"
    
    for volume in "$OLLAMA_VOLUME" "$WHISPER_VOLUME" "$SD_VOLUME"; do
        if docker volume inspect "$volume" > /dev/null 2>&1; then
            size=$(docker system df -v | grep "$volume" | awk '{print $3}' || echo "Unknown")
            echo -e "${GREEN}✓${NC} ${BOLD}$volume${NC}"
            echo -e "  Size: ${CYAN}$size${NC}"
            mountpoint=$(docker volume inspect "$volume" | grep Mountpoint | cut -d'"' -f4)
            echo -e "  Path: ${YELLOW}$mountpoint${NC}"
        else
            echo -e "${RED}✗${NC} ${BOLD}$volume${NC} - Not found"
        fi
        echo ""
    done
    
    echo -e "\n${CYAN}Press Enter to continue...${NC}"
    read
}

# Main execution
main() {
    clear
    
    # Check prerequisites
    print_section "System Check"
    check_docker
    
    # Start main menu
    main_menu
}

# Run main
main