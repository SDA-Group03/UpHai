import { Database } from "bun:sqlite";
import fs from "node:fs";

// ตรวจสอบว่ามีโฟลเดอร์ data หรือไม่ ถ้าไม่มีให้สร้างใหม่
if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

export const db = new Database("data/voke.sqlite", { create: true });

export function initDB() {
  console.log("📂 Initializing Database...");

  // ลบตารางเดิมออกก่อน (เรียงลำดับจากตารางที่มี Foreign Key ออกก่อน)
  db.run(`DROP TABLE IF EXISTS refresh_tokens;`);
  db.run(`DROP TABLE IF EXISTS instances;`);
  db.run(`DROP TABLE IF EXISTS models;`);
  db.run(`DROP TABLE IF EXISTS engines;`);
  db.run(`DROP TABLE IF EXISTS users;`);

  // 1. สร้างตาราง Users (ตารางหลัก)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  // 2. สร้างตาราง Engines
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

  // 3. สร้างตาราง Models
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
      min_memory_mb INTEGER DEFAULT 512,
      rec_memory_mb INTEGER DEFAULT 2048,
      min_cpu_cores INTEGER DEFAULT 1,
      rec_cpu_cores INTEGER DEFAULT 2,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // 4. สร้างตาราง Refresh Tokens (อ้างอิง User)
  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  db.run(`CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens (user_id);`);

  // 5. สร้างตาราง Instances (อ้างอิง Users, Engines, Models)
  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      engine_id TEXT NOT NULL,
      model_id TEXT NOT NULL,
      container_name TEXT NOT NULL,
      port INTEGER NOT NULL,
      status TEXT NOT NULL,
      allocated_memory_mb INTEGER,
      allocated_cpu_cores INTEGER,
      auto_stop_minutes INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      last_activity INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (engine_id) REFERENCES engines(id),
      FOREIGN KEY (model_id) REFERENCES models(id)
    );
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
    min_memory_mb: 512,
    rec_memory_mb: 1024,
    min_cpu_cores: 1,
    rec_cpu_cores: 1,
    description: 'Ultra-lightweight 0.5B model from Alibaba. Blazingly fast and efficient, perfect for edge devices and basic conversational tasks.',
    icon_url: 'https://sf-maas.s3.us-east-1.amazonaws.com/Model_LOGO/Tongyi.png'
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
    min_memory_mb: 1024,
    rec_memory_mb: 2048,
    min_cpu_cores: 1,
    rec_cpu_cores: 2,
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
    min_memory_mb: 1536, // ปรับจาก 1024 เพื่อให้รันได้เสถียรขึ้นตามสัดส่วนโมเดล
    rec_memory_mb: 3072, // ปรับให้ตรงกับตัวเลือก
    min_cpu_cores: 1,
    rec_cpu_cores: 2,
    description: 'Google\'s compact 2B model built on Gemini technology. Demonstrates strong context understanding and instruction following ideal for general assistance.',
    icon_url: 'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png'
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
    min_memory_mb: 2048,
    rec_memory_mb: 4096,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'Meta\'s optimized 3B model for efficient deployment. Delivers excellent speed and quality with improved instruction following and multilingual support.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Llama_AI_logo.svg'
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
    min_memory_mb: 3072, // ปรับขึ้นจาก 2048 เพื่อความลื่นไหล
    rec_memory_mb: 4096,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'Microsoft\'s powerful small model. Excels in reasoning, coding, and math, often rivaling larger models despite its compact size.',
    icon_url: 'https://raw.githubusercontent.com/microsoft/Phi-3/main/assets/phi-logo-square-blue-white.png'
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
    min_memory_mb: 6144, // ปรับจาก 4096 เพื่อรองรับ context
    rec_memory_mb: 8192,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'A benchmark 7B model known for efficiency. Uses sliding window attention to deliver exceptional reasoning and general knowledge performance.',
    icon_url: 'https://mistral.ai/images/logo_hubc88c4ece131b91c7cb753f40e9e1cc5_2589_256x0_resize_q97_h2_lanczos_3.webp'
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
    min_memory_mb: 6144,
    rec_memory_mb: 8192,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'Meta\'s enhanced 8B model with 128k context support. Features superior reasoning, tool use capability, and robustness in complex multi-turn conversations.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Llama_AI_logo.svg'
  },

  // ============= CHAT MODELS - HIGH PRECISION =============
  // หมายเหตุ: สำหรับ High Precision แนะนำใช้ Memory สูงสุดที่ระบบมี (8192) ในระดับ CPU
  {
    id: 'ollama-mixtral-8x7b',
    engine: 'ollama',
    name: 'mixtral:8x7b',
    display_name: 'Mixtral 8x7B',
    category: 'Chat',
    series: 'Mistral',
    performance_tier: 'High Precision',
    size_mb: 26000,
    min_memory_mb: 8192, // Cap ไว้ที่ตัวเลือกสูงสุด
    rec_memory_mb: 8192, 
    min_cpu_cores: 4,
    rec_cpu_cores: 4,
    description: 'Efficient Mixture-of-Experts (MoE) model. Matches 70B-level performance with faster inference, excelling in multilingual tasks and complex reasoning.',
    icon_url: 'https://mistral.ai/images/logo_hubc88c4ece131b91c7cb753f40e9e1cc5_2589_256x0_resize_q97_h2_lanczos_3.webp'
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
    min_memory_mb: 2048,
    rec_memory_mb: 4096,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'Compact 1.6B vision model for edge use. Performs impressive object detection and visual question answering with minimal resource usage.',
    icon_url: 'https://avatars.githubusercontent.com/u/149426408?s=200&v=4'
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
    min_memory_mb: 6144, // ปรับขึ้นจาก 4096
    rec_memory_mb: 8192,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'A powerful compact multimodal model. Excels at OCR and detailed image description, often outperforming larger 7B models.',
    icon_url: 'https://avatars.githubusercontent.com/u/101234275?s=200&v=4'
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
    min_memory_mb: 512,
    rec_memory_mb: 1024,
    min_cpu_cores: 1,
    rec_cpu_cores: 2,
    description: 'OpenAI\'s smallest speech model. Optimized for ultra-fast, real-time transcription on resource-constrained devices.',
    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/OpenAI_Whisper_logo.svg/200px-OpenAI_Whisper_logo.svg.png'
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
    min_memory_mb: 2048,
    rec_memory_mb: 4096,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'High-accuracy speech recognition model. Excellently handles background noise, accents, and technical terminology for professional use.',
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
    min_memory_mb: 2048,
    rec_memory_mb: 4096,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'The fastest generation method available. Enables near real-time 1-4 step image creation even on standard CPUs.',
    icon_url: 'https://stability.ai/s/images/logo.svg'
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
    min_memory_mb: 4096,
    rec_memory_mb: 8192,
    min_cpu_cores: 2,
    rec_cpu_cores: 4,
    description: 'Optimized for high aesthetic quality. Produces vibrant colors and artistic styles with excellent lighting and composition.',
    icon_url: 'https://playground.com/favicon.ico'
  }
];

    const insertEngines = db.prepare(
      "INSERT OR IGNORE INTO engines (id, name, type, docker_image, health_endpoint) VALUES (?, ?, ?, ?, ?)"
    );

    const insertModels = db.prepare(
      "INSERT OR IGNORE INTO models (id, engine, name, display_name, category, series, performance_tier, size_mb, min_memory_mb, rec_memory_mb, min_cpu_cores, rec_cpu_cores, description, icon_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
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
          model.min_memory_mb,
          model.rec_memory_mb,
          model.min_cpu_cores,
          model.rec_cpu_cores,
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