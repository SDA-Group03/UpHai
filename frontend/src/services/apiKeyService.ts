import ax from '@/conf/ax';

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
  const res = await ax.post('/keys', { name });
  return res.data;
}

export async function listApiKeys(): Promise<ApiKeyInfo[]> {
  const res = await ax.get('/keys');
  return res.data;
}

export async function deleteApiKey(id: string): Promise<void> {
  await ax.delete(`/keys/${id}`);
}
