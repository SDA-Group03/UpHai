import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

// สร้าง connection ด้วย bun:sqlite
const sqlite = new Database('voke.sqlite');
sqlite.run('PRAGMA foreign_keys = ON;');

// สร้าง drizzle client
export const db = drizzle(sqlite, { schema });
export { sqlite };
