import { verifyAccessToken } from '../services/auth.js';
import { validateApiKey } from '../services/apiKeyService.js';

type HeaderBag = Record<string, string | undefined>;

export type AccessTokenCheck =
  | { ok: true; user: { id: number; username: string } }
  | { ok: false; reason: 'missing' | 'invalid' };

export function getBearerToken(headers: HeaderBag): string | null {
  const authorization = headers.authorization ?? headers.Authorization ?? '';
  if (!authorization.startsWith('Bearer ')) {
    return null;
  }
  const token = authorization.slice('Bearer '.length);
  return token.length > 0 ? token : null;
}

export function checkAccessToken(headers: HeaderBag): AccessTokenCheck {
  const token = getBearerToken(headers);
  if (!token) {
    return { ok: false, reason: 'missing' };
  }

  // API key path: sk-uphai-...
  if (token.startsWith('sk-uphai-')) {
    const user = validateApiKey(token);
    if (!user) {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true, user };
  }

  // JWT path
  const payload = verifyAccessToken(token);
  if (!payload) {
    return { ok: false, reason: 'invalid' };
  }
  return { ok: true, user: { id: payload.sub, username: payload.username } };
}
