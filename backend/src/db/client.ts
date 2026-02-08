import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';
import fs from 'node:fs';

// ตรวจสอบว่ามีโฟลเดอร์ data หรือไม่ ถ้าไม่มีให้สร้างใหม่
if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

// สร้าง connection ด้วย bun:sqlite
const sqlite = new Database('data/voke.sqlite');
sqlite.run('PRAGMA foreign_keys = ON;');

// สร้าง drizzle client
export const db = drizzle(sqlite, { schema });
export { sqlite };
