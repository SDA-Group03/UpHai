import { createHash, randomBytes } from 'crypto';
import { db } from '../db/initdb.js';

const API_KEY_PREFIX = 'sk-uphai-';

function generateRawKey(): string {
  return API_KEY_PREFIX + randomBytes(24).toString('hex').slice(0, 32);
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function createApiKey(
  userId: number,
  name: string
): { id: string; rawKey: string; keyPrefix: string; name: string; createdAt: number } {
  const id = randomBytes(8).toString('hex');
  const rawKey = generateRawKey();
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 16) + '...';
  const createdAt = Math.floor(Date.now() / 1000);

  db.run(
    'INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, name, keyHash, keyPrefix, createdAt]
  );

  return { id, rawKey, keyPrefix, name, createdAt };
}

export function validateApiKey(
  rawKey: string
): { id: number; username: string } | null {
  if (!rawKey.startsWith(API_KEY_PREFIX)) return null;

  const keyHash = hashKey(rawKey);
  const row = db
    .query(
      `SELECT ak.user_id, u.username
       FROM api_keys ak
       JOIN users u ON u.id = ak.user_id
       WHERE ak.key_hash = ?`
    )
    .get(keyHash) as { user_id: number; username: string } | null;

  if (!row) return null;

  // Update last_used_at in background (non-blocking)
  db.run('UPDATE api_keys SET last_used_at = ? WHERE key_hash = ?', [
    Math.floor(Date.now() / 1000),
    keyHash,
  ]);

  return { id: row.user_id, username: row.username };
}

export function listApiKeys(
  userId: number
): Array<{ id: string; name: string; keyPrefix: string; createdAt: number; lastUsedAt: number | null }> {
  const rows = db
    .query(
      'SELECT id, name, key_prefix, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
    )
    .all(userId) as Array<{
    id: string;
    name: string;
    key_prefix: string;
    created_at: number;
    last_used_at: number | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    keyPrefix: r.key_prefix,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  }));
}

export function deleteApiKey(id: string, userId: number): boolean {
  const result = db.run(
    'DELETE FROM api_keys WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.changes > 0;
}
