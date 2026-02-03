import { Elysia, t } from 'elysia';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db/client.js';
import { refreshTokens, users } from '../db/schema.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../config/env.js';
import { checkAccessToken } from '../middleware/auth.js';
import {
  clearRefreshTokenCookie,
  createAccessToken,
  createRefreshToken,
  hashPassword,
  hashRefreshToken,
  nowSeconds,
  setRefreshTokenCookie,
  verifyPassword,
} from '../services/auth.js';

const credentialsBody = t.Object({
  username: t.String({ minLength: 3, maxLength: 64 }),
  password: t.String({ minLength: 8, maxLength: 72 }),
});

const refreshCookieSchema = t.Object({
  [REFRESH_TOKEN_COOKIE_NAME]: t.Optional(t.String({ minLength: 20 })),
});

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/register',
    ({ body, set }) => {
      const username = body.username.trim();
      if (username.length < 3) {
        set.status = 400;
        return { error: 'Invalid username' };
      }
      const existing = db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .get();
      if (existing) {
        set.status = 409;
        return { error: 'Username already exists' };
      }
      const passwordHash = hashPassword(body.password);
      db.insert(users)
        .values({ username, passwordHash })
        .run();
      const created = db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .get();
      set.status = 201;
      return {
        id: created?.id ?? 0,
        username,
      };
    },
    {
      body: credentialsBody,
    }
  )
  .post(
    '/login',
    ({ body, set }) => {
      const username = body.username.trim();
      const user = db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .get();
      if (!user || !verifyPassword(body.password, user.passwordHash)) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }
      const accessToken = createAccessToken(user);
      const refresh = createRefreshToken();
      const issuedAt = nowSeconds();
      db.insert(refreshTokens)
        .values({
          userId: user.id,
          tokenHash: refresh.tokenHash,
          createdAt: issuedAt,
          expiresAt: refresh.expiresAt,
        })
        .run();
      setRefreshTokenCookie(set, refresh.token);
      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        refreshTokenExpiresAt: refresh.expiresAt,
      };
    },
    {
      body: credentialsBody,
    }
  )
  .post(
    '/refresh',
    ({ cookie, set }) => {
      const refreshToken = cookie[REFRESH_TOKEN_COOKIE_NAME]?.value;
      if (typeof refreshToken !== 'string' || refreshToken.length < 20) {
        set.status = 401;
        clearRefreshTokenCookie(set);
        return { error: 'Missing refresh token' };
      }
      const tokenHash = hashRefreshToken(refreshToken);
      const tokenRow = db
        .select()
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.tokenHash, tokenHash),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, nowSeconds())
          )
        )
        .get();
      if (!tokenRow) {
        set.status = 401;
        clearRefreshTokenCookie(set);
        return { error: 'Invalid refresh token' };
      }
      const user = db
        .select()
        .from(users)
        .where(eq(users.id, tokenRow.userId))
        .get();
      if (!user) {
        set.status = 401;
        clearRefreshTokenCookie(set);
        return { error: 'Invalid refresh token' };
      }
      const revokedAt = nowSeconds();
      db.update(refreshTokens)
        .set({ revokedAt })
        .where(eq(refreshTokens.id, tokenRow.id))
        .run();
      const refresh = createRefreshToken();
      db.insert(refreshTokens)
        .values({
          userId: user.id,
          tokenHash: refresh.tokenHash,
          createdAt: revokedAt,
          expiresAt: refresh.expiresAt,
        })
        .run();
      setRefreshTokenCookie(set, refresh.token);
      const accessToken = createAccessToken(user);
      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        refreshTokenExpiresAt: refresh.expiresAt,
      };
    },
    {
      cookie: refreshCookieSchema,
    }
  )
  .post(
    '/logout',
    ({ cookie, set }) => {
      const refreshToken = cookie[REFRESH_TOKEN_COOKIE_NAME]?.value;
      if (typeof refreshToken === 'string' && refreshToken.length >= 20) {
        const tokenHash = hashRefreshToken(refreshToken);
        db.update(refreshTokens)
          .set({ revokedAt: nowSeconds() })
          .where(
            and(
              eq(refreshTokens.tokenHash, tokenHash),
              isNull(refreshTokens.revokedAt)
            )
          )
          .run();
      }
      clearRefreshTokenCookie(set);
      return { ok: true };
    },
    {
      cookie: refreshCookieSchema,
    }
  )
  .get('/me', ({ headers, set }) => {
    const result = checkAccessToken(headers);
    if (!result.ok) {
      set.status = 401;
      return {
        error:
          result.reason === 'missing'
            ? 'Missing access token'
            : 'Invalid or expired access token',
      };
    }
    return result.user;
  });
