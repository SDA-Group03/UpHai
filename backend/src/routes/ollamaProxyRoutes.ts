import { Elysia } from 'elysia';
import { resolveUpstream } from './proxyUtils';
import { instanceService } from '../services/instanceService';

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
      const url = await resolveUpstream(port, '/api/tags');
      const res = await fetch(url, {
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

    void instanceService.touchInstanceByPort(port).catch(() => {});

    try {
      const body = await request.json();
      const url = await resolveUpstream(port, '/api/chat');
      const upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!upstream.ok) {
        set.status = upstream.status;
        return { error: `Ollama error: ${upstream.status} ${upstream.statusText}` };
      }

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
