import { Buffer } from 'node:buffer';
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE_SAMESITE,
  REFRESH_TOKEN_COOKIE_SECURE,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../config/env.js';

const PASSWORD_PREFIX = 'scrypt';
const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

export type AccessTokenPayload = {
  sub: number;
  username: string;
  iat: number;
  exp: number;
};

type CookieSetter = { cookie?: Record<string, Record<string, unknown>> };

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function base64UrlEncode(data: Buffer): string {
  return data
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
  return Buffer.from(padded, 'base64');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS);
  return [
    PASSWORD_PREFIX,
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$');
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3) {
    return false;
  }
  const [prefix, saltB64, hashB64] = parts;
  if (prefix !== PASSWORD_PREFIX) {
    return false;
  }
  const salt = Buffer.from(saltB64, 'base64');
  const hash = Buffer.from(hashB64, 'base64');
  const candidate = scryptSync(password, salt, hash.length, SCRYPT_OPTIONS);
  return timingSafeEqual(hash, candidate);
}

export function createAccessToken(user: { id: number; username: string }): string {
  const issuedAt = nowSeconds();
  const payload: AccessTokenPayload = {
    sub: user.id,
    username: user.username,
    iat: issuedAt,
    exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
  };
  const header = { alg: 'HS256', typ: 'JWT' };
  const unsigned = [
    base64UrlEncode(Buffer.from(JSON.stringify(header))),
    base64UrlEncode(Buffer.from(JSON.stringify(payload))),
  ].join('.');
  const signature = createHmac('sha256', ACCESS_TOKEN_SECRET)
    .update(unsigned)
    .digest();
  return `${unsigned}.${base64UrlEncode(signature)}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const unsigned = `${headerB64}.${payloadB64}`;
  const expected = createHmac('sha256', ACCESS_TOKEN_SECRET)
    .update(unsigned)
    .digest();
  const provided = base64UrlDecode(signatureB64);
  if (expected.length !== provided.length) {
    return null;
  }
  if (!timingSafeEqual(expected, provided)) {
    return null;
  }
  let payload: AccessTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8')) as AccessTokenPayload;
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number') {
    return null;
  }
  if (payload.exp <= nowSeconds()) {
    return null;
  }
  return payload;
}

export function createRefreshToken(): {
  token: string;
  tokenHash: string;
  expiresAt: number;
} {
  const token = base64UrlEncode(randomBytes(32));
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return {
    token,
    tokenHash,
    expiresAt: nowSeconds() + REFRESH_TOKEN_TTL_SECONDS,
  };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function setRefreshTokenCookie(set: CookieSetter, token: string): void {
  set.cookie ??= {};
  set.cookie[REFRESH_TOKEN_COOKIE_NAME] = {
    value: token,
    httpOnly: true,
    secure: REFRESH_TOKEN_COOKIE_SECURE,
    sameSite: REFRESH_TOKEN_COOKIE_SAMESITE,
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  };
}

export function clearRefreshTokenCookie(set: CookieSetter): void {
  set.cookie ??= {};
  set.cookie[REFRESH_TOKEN_COOKIE_NAME] = {
    value: '',
    httpOnly: true,
    secure: REFRESH_TOKEN_COOKIE_SECURE,
    sameSite: REFRESH_TOKEN_COOKIE_SAMESITE,
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: 0,
  };
}
