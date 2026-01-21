import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// สร้าง connection ด้วย better-sqlite3
const sqlite = new Database('voke.sqlite');
sqlite.pragma('foreign_keys = ON');

// สร้าง drizzle client
export const db = drizzle(sqlite, { schema });
export { sqlite };
