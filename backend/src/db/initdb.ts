import { Database } from "bun:sqlite";
import fs from "node:fs";

// ตรวจสอบว่ามีโฟลเดอร์ data หรือไม่ ถ้าไม่มีให้สร้างใหม่
if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

export const db = new Database("data/voke.sqlite", { create: true });

export function initDB() {
  console.log("📂 Initializing Database...");

  db.run(`
    CREATE TABLE IF NOT EXISTS engines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      docker_image TEXT NOT NULL,
      health_endpoint TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      engine TEXT NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      category TEXT NOT NULL,
      series TEXT,
      performance_tier TEXT,
      size_mb INTEGER,
      icon_url TEXT,
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      engine_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      container_name TEXT NOT NULL,
      port INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      last_activity INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (engine_id) REFERENCES engines(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens (user_id);
  `);

  seedDB();
  console.log("✅ Database ready!");
}

export function seedDB() {
  try {
    const engines = [
      { id: 'ollama', name: 'Ollama', type: 'llm', docker_image: 'ollama/ollama', health_endpoint: '/api/tags' },
      { id: 'whisper', name: 'Whisper', type: 'speech', docker_image: 'voke/whisper:latest', health_endpoint: '/health' },
      { id: 'stable-diffusion', name: 'Stable Diffusion', type: 'image', docker_image: 'voke/stable-diffusion:latest', health_endpoint: '/ping' }
    ];

 const models = [
  // ============= CHAT MODELS - TURBO / NANO =============
  {
    id: 'ollama-qwen2-0.5b',
    engine: 'ollama',
    name: 'qwen2:0.5b',
    display_name: 'Qwen 2 (0.5B)',
    category: 'Chat',
    series: 'Qwen',
    performance_tier: 'Turbo / Nano',
    size_mb: 352,
    description: 'Ultra-lightweight 0.5B model from Alibaba. Blazingly fast and efficient, perfect for edge devices and basic conversational tasks.',
    icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png' // Original Tongyi Mascot
  },
  {
    id: 'ollama-qwen2-1.5b',
    engine: 'ollama',
    name: 'qwen2:1.5b',
    display_name: 'Qwen 2 (1.5B)',
    category: 'Chat',
    series: 'Qwen',
    performance_tier: 'Turbo / Nano',
    size_mb: 934,
    description: 'Efficient 1.5B model balancing size and capability. Offers improved reasoning and understanding for general chat and basic coding assistance.',
    icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
  },
  {
    id: 'ollama-gemma-2b',
    engine: 'ollama',
    name: 'gemma:2b',
    display_name: 'Gemma (2B)',
    category: 'Chat',
    series: 'Gemma',
    performance_tier: 'Turbo / Nano',
    size_mb: 1400,
    description: 'Google\'s compact 2B model built on Gemini technology. Demonstrates strong context understanding and instruction following ideal for general assistance.',
    icon_url: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png' // Official Gemma Sparkle
  },

  // ============= CHAT MODELS - BALANCED =============
  {
    id: 'ollama-llama3.2-3b',
    engine: 'ollama',
    name: 'llama3.2:3b',
    display_name: 'Llama 3.2 (3B)',
    category: 'Chat',
    series: 'Llama',
    performance_tier: 'Balanced',
    size_mb: 2000,
    description: 'Meta\'s optimized 3B model for efficient deployment. Delivers excellent speed and quality with improved instruction following and multilingual support.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Llama_AI_logo.svg' // Specific Llama Logo (Not Meta)
  },
  {
    id: 'ollama-phi3-3.8b',
    engine: 'ollama',
    name: 'phi3:3.8b',
    display_name: 'Phi-3 (3.8B)',
    category: 'Chat',
    series: 'Phi',
    performance_tier: 'Balanced',
    size_mb: 2300,
    description: 'Microsoft\'s powerful small model. Excels in reasoning, coding, and math, often rivaling larger models despite its compact size.',
    icon_url: 'https://raw.githubusercontent.com/microsoft/Phi-3/main/assets/phi-logo-square-blue-white.png' // Official Phi Logo
  },
  {
    id: 'ollama-mistral-7b',
    engine: 'ollama',
    name: 'mistral:7b',
    display_name: 'Mistral (7B)',
    category: 'Chat',
    series: 'Mistral',
    performance_tier: 'Balanced',
    size_mb: 4100,
    description: 'A benchmark 7B model known for efficiency. Uses sliding window attention to deliver exceptional reasoning and general knowledge performance.',
    icon_url: 'https://mistral.ai/images/logo_hubc88c4ece131b91c7cb753f40e9e1cc5_2589_256x0_resize_q97_h2_lanczos_3.webp' // Official Mistral
  },
  {
    id: 'ollama-llama3.1-8b',
    engine: 'ollama',
    name: 'llama3.1:8b',
    display_name: 'Llama 3.1 (8B)',
    category: 'Chat',
    series: 'Llama',
    performance_tier: 'Balanced',
    size_mb: 4700,
    description: 'Meta\'s enhanced 8B model with 128k context support. Features superior reasoning, tool use capability, and robustness in complex multi-turn conversations.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Llama_AI_logo.svg'
  },

  // ============= CHAT MODELS - HIGH PRECISION =============
  {
    id: 'ollama-mixtral-8x7b',
    engine: 'ollama',
    name: 'mixtral:8x7b',
    display_name: 'Mixtral 8x7B',
    category: 'Chat',
    series: 'Mistral',
    performance_tier: 'High Precision',
    size_mb: 26000,
    description: 'Efficient Mixture-of-Experts (MoE) model. Matches 70B-level performance with faster inference, excelling in multilingual tasks and complex reasoning.',
    icon_url: 'https://mistral.ai/images/logo_hubc88c4ece131b91c7cb753f40e9e1cc5_2589_256x0_resize_q97_h2_lanczos_3.webp'
  },
  {
    id: 'ollama-llama3.3-70b',
    engine: 'ollama',
    name: 'llama3.3:70b',
    display_name: 'Llama 3.3 (70B)',
    category: 'Chat',
    series: 'Llama',
    performance_tier: 'High Precision',
    size_mb: 43000,
    description: 'Meta\'s SOTA open model. Delivers expert-level performance in complex reasoning, coding, and creative writing, ideal for demanding production tasks.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Llama_AI_logo.svg'
  },

  // ============= VISION MODELS =============
  {
    id: 'ollama-moondream',
    engine: 'ollama',
    name: 'moondream',
    display_name: 'Moondream 2',
    category: 'Vision',
    series: 'Moondream',
    performance_tier: 'Turbo / Nano',
    size_mb: 1600,
    description: 'Compact 1.6B vision model for edge use. Performs impressive object detection and visual question answering with minimal resource usage.',
    icon_url: 'https://avatars.githubusercontent.com/u/149426408?s=200&v=4' // GitHub Project Avatar
  },
  {
    id: 'ollama-minicpm-v',
    engine: 'ollama',
    name: 'minicpm-v',
    display_name: 'MiniCPM-V 2.6',
    category: 'Vision',
    series: 'MiniCPM',
    performance_tier: 'Turbo / Nano',
    size_mb: 5500,
    description: 'A powerful compact multimodal model. Excels at OCR and detailed image description, often outperforming larger 7B models.',
    icon_url: 'https://avatars.githubusercontent.com/u/101234275?s=200&v=4' // OpenBMB GitHub Avatar
  },
  {
    id: 'ollama-llava-7b',
    engine: 'ollama',
    name: 'llava:7b',
    display_name: 'LLaVA 7B',
    category: 'Vision',
    series: 'LLaVA',
    performance_tier: 'Balanced',
    size_mb: 4500,
    description: 'Powerful vision-language assistant. Combines visual understanding with NLP to describe images, read text, and answer complex visual queries.',
    icon_url: 'https://www.llava-vl.com/images/llava_logo.png' // Official LLaVA
  },
  {
    id: 'ollama-qwen2-vl',
    engine: 'ollama',
    name: 'qwen2-vl',
    display_name: 'Qwen2-VL (7B)',
    category: 'Vision',
    series: 'Qwen',
    performance_tier: 'Balanced',
    size_mb: 5000,
    description: 'State-of-the-art vision language model. Capable of understanding videos of up to 20 minutes and high-resolution images with complex reasoning.',
    icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
  },
  {
    id: 'ollama-llama3.2-vision-11b',
    engine: 'ollama',
    name: 'llama3.2-vision:11b',
    display_name: 'Llama 3.2 Vision (11B)',
    category: 'Vision',
    series: 'Llama',
    performance_tier: 'High Precision',
    size_mb: 7900,
    description: 'Meta\'s cutting-edge multimodal model. Seamlessly integrates high-fidelity visual understanding, OCR, and reasoning for professional analysis.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Llama_AI_logo.svg'
  },

  // ============= CODING MODELS =============
  {
    id: 'ollama-codeqwen-1.5b',
    engine: 'ollama',
    name: 'codeqwen:1.5b',
    display_name: 'CodeQwen (1.5B)',
    category: 'Chat',
    series: 'Qwen',
    performance_tier: 'Turbo / Nano',
    size_mb: 900,
    description: 'Specialized lightweight coding model. Delivers fast code completion and debugging across multiple languages with very low latency.',
    icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
  },
  {
    id: 'ollama-deepseek-coder-6.7b',
    engine: 'ollama',
    name: 'deepseek-coder:6.7b',
    display_name: 'DeepSeek Coder (6.7B)',
    category: 'Chat',
    series: 'DeepSeek',
    performance_tier: 'Balanced',
    size_mb: 3800,
    description: 'Top-tier coding model trained on massive repos. Excels at complex algorithm implementation, system design, and production-ready code generation.',
    icon_url: 'https://avatars.githubusercontent.com/u/145223814?s=200&v=4' // DeepSeek Bear Avatar
  },

  // ============= AUDIO MODELS =============
  {
    id: 'whisper-tiny',
    engine: 'whisper',
    name: 'tiny',
    display_name: 'Whisper Tiny',
    category: 'Audio',
    series: 'Whisper',
    performance_tier: 'Turbo / Nano',
    size_mb: 75,
    description: 'OpenAI\'s smallest speech model. Optimized for ultra-fast, real-time transcription on resource-constrained devices.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/OpenAI_Whisper_logo.svg/200px-OpenAI_Whisper_logo.svg.png' // Whisper Specific Logo
  },
  {
    id: 'whisper-medium',
    engine: 'whisper',
    name: 'medium',
    display_name: 'Whisper Medium',
    category: 'Audio',
    series: 'Whisper',
    performance_tier: 'Balanced',
    size_mb: 1500,
    description: 'High-accuracy speech recognition model. Excellently handles background noise, accents, and technical terminology for professional use.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/OpenAI_Whisper_logo.svg/200px-OpenAI_Whisper_logo.svg.png'
  },
  {
    id: 'whisper-large-v3',
    engine: 'whisper',
    name: 'large-v3',
    display_name: 'Whisper Large v3',
    category: 'Audio',
    series: 'Whisper',
    performance_tier: 'High Precision',
    size_mb: 3100,
    description: 'The state-of-the-art open speech recognition model. Offers unmatched accuracy across multiple languages and challenging audio environments.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/OpenAI_Whisper_logo.svg/200px-OpenAI_Whisper_logo.svg.png'
  },

  // ============= IMAGE GENERATION =============
  {
    id: 'lcm-lora',
    engine: 'stable-diffusion',
    name: 'lcm-sd-1.5',
    display_name: 'LCM LoRA (Ultra Fast)',
    category: 'Image',
    series: 'Stable Diffusion',
    performance_tier: 'Turbo / Nano',
    size_mb: 800,
    description: 'The fastest generation method available. Enables near real-time 1-4 step image creation even on standard CPUs.',
    icon_url: 'https://stability.ai/s/images/logo.svg' // Stability AI Logo
  },
  {
    id: 'playground-v2-cpu',
    engine: 'stable-diffusion',
    name: 'playground-v2',
    display_name: 'Playground v2 (Best Aesthetics)',
    category: 'Image',
    series: 'Playground',
    performance_tier: 'Balanced',
    size_mb: 3200,
    description: 'Optimized for high aesthetic quality. Produces vibrant colors and artistic styles with excellent lighting and composition.',
    icon_url: 'https://playground.com/favicon.ico'
  },
  {
    id: 'sd-xl-turbo',
    engine: 'stable-diffusion',
    name: 'sdxl-turbo',
    display_name: 'SDXL Turbo',
    category: 'Image',
    series: 'Stable Diffusion',
    performance_tier: 'Balanced',
    size_mb: 6900,
    description: 'Revolutionary real-time model. Generates detailed, high-resolution 1024x1024 images in a single step with high prompt adherence.',
    icon_url: 'https://stability.ai/s/images/logo.svg'
  }
];

    const insertEngines = db.prepare(
      "INSERT OR IGNORE INTO engines (id, name, type, docker_image, health_endpoint) VALUES (?, ?, ?, ?, ?)"
    );

    const insertModels = db.prepare(
      "INSERT OR IGNORE INTO models (id, engine, name, display_name, category, series, performance_tier, size_mb, description, icon_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    const seedTransaction = db.transaction(() => {
      for (const engine of engines)
        insertEngines.run(engine.id, engine.name, engine.type, engine.docker_image, engine.health_endpoint);

      for (const model of models)
        insertModels.run(
          model.id,
          model.engine,
          model.name,
          model.display_name,
          model.category,
          model.series,
          model.performance_tier,
          model.size_mb,
          model.description,
          model.icon_url
        );
    });

    seedTransaction();
    console.log("🌱 Seed data updated.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}