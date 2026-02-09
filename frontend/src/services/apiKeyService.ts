import { getAccessToken } from './authService';

const normalizeApiOrigin = (value: string) => {
  const normalized = value.trim().replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized;
};

const apiOrigin = normalizeApiOrigin(import.meta.env.VITE_API_URL ?? '');
const API_KEYS_URL = `${apiOrigin}/api/keys`;

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: number;
  lastUsedAt: number | null;
}

export interface CreateApiKeyResponse {
  id: string;
  rawKey: string;
  keyPrefix: string;
  name: string;
  createdAt: number;
}

export async function createApiKey(name: string): Promise<CreateApiKeyResponse> {
  const res = await fetch(API_KEYS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to create API key (${res.status})`);
  }
  return res.json();
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const res = await fetch(API_KEYS_URL, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch API keys');
  return res.json();
}

export async function deleteApiKey(id: string): Promise<void> {
  const res = await fetch(`${API_KEYS_URL}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete API key');
}
