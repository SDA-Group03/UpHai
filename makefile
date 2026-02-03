# ==========================================
# [UpHai] PROJECT MANAGER
# ==========================================

# Config Variables
NETWORK_NAME := uphai-net
BACKEND_DIR := backend
FRONTEND_DIR := frontend
MODEL_DIR := $(BACKEND_DIR)/model

.PHONY: help setup infra reinstall clean ollama dev dev-be dev-fe nuke

# ----------------------------------------------------------------
# HELP COMMANDS
# ----------------------------------------------------------------
help:
	@echo "================================================"
	@echo "   UpHai COMMANDS"
	@echo "================================================"
	@echo "[ SETUP & MAINTAIN ]"
	@echo "  make setup     : Install dependencies (First time)"
	@echo "  make reinstall : Delete node_modules & Reinstall (Fix broken deps)"
	@echo "  make infra     : Create Network & Pull Docker Images"
	@echo "  make clean     : Remove build folders (dist)"
	@echo ""
	@echo "[ SERVICES ]"
	@echo "  make ollama    : Start Ollama Container (AI Engine)"
	@echo ""
	@echo "[ RUN DEV ]"
	@echo "  make dev       : Run Backend + Frontend"
	@echo "  make dev-be    : Run Backend only"
	@echo "  make dev-fe    : Run Frontend only"
	@echo ""
	@echo "[ RESET ]"
	@echo "  make nuke      : Stop & Remove ALL Containers/Networks"
	@echo "================================================"

# ----------------------------------------------------------------
# SETUP & INFRA
# ----------------------------------------------------------------
setup:
	@echo "[INFO] Installing Backend dependencies..."
	@cd $(BACKEND_DIR) && bun install
	@echo "[INFO] Installing Frontend dependencies..."
	@cd $(FRONTEND_DIR) && bun install
	@echo "[OK] Dependencies installed!"

reinstall:
	@echo "[WARN] Nuke node_modules & lockfiles..."
	@rm -rf $(BACKEND_DIR)/node_modules $(BACKEND_DIR)/bun.lockb
	@rm -rf $(FRONTEND_DIR)/node_modules $(FRONTEND_DIR)/bun.lockb
	@echo "[INFO] Re-installing fresh dependencies..."
	@make setup

clean:
	@echo "[CLEAN] Removing build artifacts..."
	@rm -rf $(BACKEND_DIR)/dist $(FRONTEND_DIR)/dist
	@echo "[OK] Cleaned!"

infra:
	@echo "[INFO] Setting up UpHai Infrastructure..."
	@echo "   -> Creating Network: $(NETWORK_NAME)..."
	@docker network create $(NETWORK_NAME) 2>/dev/null || echo "      Network exists, skipping."
	
	@echo "   -> Checking Model Directory..."
	@mkdir -p $(MODEL_DIR)
	
	@echo "   -> Pulling Ollama Image..."
	@docker pull ollama/ollama:latest
	@echo "[OK] Infrastructure Ready!"

# ----------------------------------------------------------------
# SERVICES
# ----------------------------------------------------------------
ollama:
	@echo "[AI] Starting Ollama Container..."
	# Check if running first to avoid error
	@docker ps -q --filter "name=ollama-service" | grep -q . && echo "   -> Ollama already running." || \
	docker run -d --rm --name ollama-service --network $(NETWORK_NAME) -v $(MODEL_DIR):/root/.ollama -p 11434:11434 ollama/ollama:latest
	@echo "[OK] Ollama is ready!"

# ----------------------------------------------------------------
# DEVELOPMENT
# ----------------------------------------------------------------
dev:
	@echo "[GO] Launching UpHai..."
	@make -j2 dev-be dev-fe

dev-be:
	@echo "[...] Starting Backend (Bun)..."
	@cd $(BACKEND_DIR) && bun run index.ts

dev-fe:
	@echo "[...] Starting Frontend (Vite)..."
	@cd $(FRONTEND_DIR) && bun run dev

# ----------------------------------------------------------------
# NUKE (Clean up)
# ----------------------------------------------------------------
nuke:
	@echo "[WARN] Cleaning up UpHai System..."
	@echo "   -> Stopping Containers..."
	@docker ps -a --filter "network=$(NETWORK_NAME)" -q | xargs -r docker rm -f
	@echo "   -> Removing Network..."
	@docker network rm $(NETWORK_NAME) 2>/dev/null || true
	@echo "[DONE] System Cleaned! Run 'make infra' to start again."
