import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createApiKey,
  listApiKeys,
  deleteApiKey,
  type ApiKeyInfo,
  type CreateApiKeyResponse,
} from '@/services/apiKeyService';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newlyCreated, setNewlyCreated] = useState<CreateApiKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchKeys = useCallback(async () => {
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const result = await createApiKey(newKeyName.trim());
      setNewlyCreated(result);
      setNewKeyName('');
      await fetchKeys();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      setError('Failed to delete API key');
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Key size={24} />
          API Keys
        </h1>
        <p className="text-gray-500 mt-1">
          Create API keys to access Ollama and Whisper proxy endpoints externally.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create New Key</CardTitle>
          <CardDescription>
            The key will only be shown once. Store it securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Key name (e.g. my-app)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              disabled={creating}
            />
            <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
              <Plus size={16} className="mr-1" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {newlyCreated && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-green-800 mb-2">
              API key created! Copy it now — it won't be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono break-all">
                {newlyCreated.rawKey}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(newlyCreated.rawKey)}
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="text-xs text-green-700 mt-2">
              Use as: <code className="bg-white/50 px-1 rounded">Authorization: Bearer {newlyCreated.rawKey.slice(0, 16)}...</code>
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : keys.length === 0 ? (
            <p className="text-gray-400 text-sm">No API keys yet.</p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between border rounded-lg px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{key.name}</p>
                    <p className="text-sm text-gray-500 font-mono">{key.keyPrefix}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Created {formatDate(key.createdAt)}
                      {key.lastUsedAt && ` · Last used ${formatDate(key.lastUsedAt)}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    onClick={() => handleDelete(key.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
