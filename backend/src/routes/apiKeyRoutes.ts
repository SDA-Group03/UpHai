import { Elysia } from 'elysia';
import { checkAccessToken } from '../middleware/auth';
import {
  createApiKey,
  listApiKeys,
  deleteApiKey,
} from '../services/apiKeyService';

export const apiKeyRoutes = new Elysia({ prefix: '/api/keys' })
  .onBeforeHandle(({ request, set }) => {
    const auth = checkAccessToken(Object.fromEntries(request.headers));
    if (!auth.ok) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }
  })
  .post('/', async ({ request, set }) => {
    const auth = checkAccessToken(Object.fromEntries(request.headers));
    if (!auth.ok) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const body = await request.json().catch(() => null);
    const name = (body as any)?.name;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      set.status = 400;
      return { error: 'Name is required' };
    }

    const result = createApiKey(auth.user.id, name.trim());
    set.status = 201;
    return result;
  })
  .get('/', ({ request }) => {
    const auth = checkAccessToken(Object.fromEntries(request.headers));
    if (!auth.ok) return [];
    return listApiKeys(auth.user.id);
  })
  .delete('/:id', ({ request, params, set }) => {
    const auth = checkAccessToken(Object.fromEntries(request.headers));
    if (!auth.ok) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const deleted = deleteApiKey(params.id, auth.user.id);
    if (!deleted) {
      set.status = 404;
      return { error: 'API key not found' };
    }
    return { ok: true };
  });
