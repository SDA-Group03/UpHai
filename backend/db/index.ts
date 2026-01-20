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

  console.log("✅ Database ready!");
}