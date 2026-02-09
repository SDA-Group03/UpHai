import { Elysia } from 'elysia';
import { resolveUpstream } from './proxyUtils';
import { instanceService } from '../services/instanceService';

const parsePort = (raw: unknown): number | null => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const port = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;
  return port;
};

async function proxyWhisperMultipart(
  port: number,
  path: string,
  request: Request
): Promise<Response> {
  const upstreamForm = await request.formData();
  const upstreamFile = upstreamForm.get('file');

  if (!(upstreamFile instanceof Blob)) {
    return Response.json({ error: 'Missing file' }, { status: 400 });
  }

  const formData = new FormData();
  for (const [key, value] of upstreamForm.entries()) {
    if (key === 'port') continue;
    formData.append(key, value as any);
  }

  const url = await resolveUpstream(port, path);
  const upstream = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  const isEventStream = contentType.includes('text/event-stream');

  if (isEventStream && upstream.body) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': contentType,
        'cache-control': upstream.headers.get('cache-control') ?? 'no-cache',
      },
    });
  }

  const payload = contentType.includes('application/json')
    ? await upstream.json().catch(async () => ({ error: await upstream.text() }))
    : await upstream.text();

  if (typeof payload === 'string') {
    return new Response(payload, {
      status: upstream.status,
      headers: { 'content-type': contentType || 'text/plain; charset=utf-8' },
    });
  }

  return Response.json(payload, { status: upstream.status });
}

export const whisperProxyRoutes = new Elysia({ prefix: '/api/whisper' })
  .get('/health', async ({ query, set }) => {
    const port = parsePort((query as any)?.port);
    if (!port) {
      set.status = 400;
      return { ok: false, error: 'Invalid port' };
    }

    try {
      const url = await resolveUpstream(port, '/');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return { ok: res.ok };
    } catch (error: any) {
      set.status = 200;
      return { ok: false, error: error?.message ?? 'Health check failed' };
    }
  })
  .post('/audio/transcriptions', async ({ query, set, request }) => {
    const port = parsePort((query as any)?.port);
    if (!port) {
      set.status = 400;
      return { error: 'Invalid port' };
    }

    void instanceService.touchInstanceByPort(port).catch(() => {});

    try {
      return await proxyWhisperMultipart(port, '/v1/audio/transcriptions', request);
    } catch (error: any) {
      set.status = 502;
      return { error: error?.message ?? 'Failed to proxy transcription request' };
    }
  })
  .post('/audio/translations', async ({ query, set, request }) => {
    const port = parsePort((query as any)?.port);
    if (!port) {
      set.status = 400;
      return { error: 'Invalid port' };
    }

    void instanceService.touchInstanceByPort(port).catch(() => {});

    try {
      return await proxyWhisperMultipart(port, '/v1/audio/translations', request);
    } catch (error: any) {
      set.status = 502;
      return { error: error?.message ?? 'Failed to proxy translation request' };
    }
  });
