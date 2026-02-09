import { Elysia } from 'elysia';

const DOCKER_NETWORK = process.env.DOCKER_NETWORK || '';
const PROXY_HOST = DOCKER_NETWORK ? 'host.docker.internal' : '127.0.0.1';

const parsePort = (raw: unknown): number | null => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const port = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;
  return port;
};

export const ollamaProxyRoutes = new Elysia({ prefix: '/api/ollama' })
  .get('/health', async ({ query, set }) => {
    const port = parsePort((query as any)?.port);
    if (!port) {
      set.status = 400;
      return { ok: false, error: 'Invalid port' };
    }

    try {
      const res = await fetch(`http://${PROXY_HOST}:${port}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      return { ok: res.ok };
    } catch (error: any) {
      set.status = 200;
      return { ok: false, error: error?.message ?? 'Health check failed' };
    }
  })
  .post('/chat', async ({ query, set, request }) => {
    const port = parsePort((query as any)?.port);
    if (!port) {
      set.status = 400;
      return { error: 'Invalid port' };
    }

    try {
      const body = await request.json();
      const upstream = await fetch(`http://${PROXY_HOST}:${port}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!upstream.ok) {
        set.status = upstream.status;
        return { error: `Ollama error: ${upstream.status} ${upstream.statusText}` };
      }

      // Stream response back to client
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'content-type': upstream.headers.get('content-type') ?? 'application/x-ndjson',
          'cache-control': 'no-cache',
        },
      });
    } catch (error: any) {
      set.status = 502;
      return { error: error?.message ?? 'Failed to proxy chat request' };
    }
  });
