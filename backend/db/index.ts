import { Database } from "bun:sqlite";

export const db = new Database("voke.sqlite", { create: true });

export function initDB() {
  console.log("📂 Initializing Database...");


  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);


  db.run(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      icon_url TEXT,
      
      docker_image TEXT NOT NULL,
      docker_tag TEXT DEFAULT 'latest',
      internal_port INTEGER NOT NULL,
      
      requires_gpu INTEGER DEFAULT 0,
      min_vram_gb INTEGER DEFAULT 0,
      
      -- Min Specs --
      min_cpu_cores REAL DEFAULT 1.0,
      min_ram_gb INTEGER DEFAULT 1,
      
      -- Rec Specs --
      rec_cpu_cores REAL DEFAULT 1.0,
      rec_ram_gb INTEGER DEFAULT 1,
      
      volume_path TEXT,
      default_env_vars TEXT
      
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      model_id INTEGER NOT NULL,

      container_id TEXT,
      name TEXT NOT NULL,
      
      status TEXT DEFAULT 'pending', 
      
      host_port INTEGER,
      
      -- Resource Snapshot --
      cpu_cores REAL, 
      ram_gb REAL,  
      is_gpu_enabled INTEGER DEFAULT 0,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active_at DATETIME,

      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(model_id) REFERENCES models(id)
    );
  `);

  console.log("✅ Database ready!");
}