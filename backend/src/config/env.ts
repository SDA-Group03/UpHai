const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const ACCESS_TOKEN_TTL_SECONDS = parseNumber(
  process.env.ACCESS_TOKEN_TTL_SECONDS,
  15 * 60
);
export const REFRESH_TOKEN_TTL_SECONDS = parseNumber(
  process.env.REFRESH_TOKEN_TTL_SECONDS,
  30 * 24 * 60 * 60
);
export const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? 'dev-secret-change-me';

export const REFRESH_TOKEN_COOKIE_NAME =
  process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'refreshToken';
export const REFRESH_TOKEN_COOKIE_PATH =
  process.env.REFRESH_TOKEN_COOKIE_PATH ?? '/auth';

const envSameSite = process.env.REFRESH_TOKEN_COOKIE_SAMESITE;
export const REFRESH_TOKEN_COOKIE_SAMESITE =
  envSameSite === 'strict' || envSameSite === 'none' || envSameSite === 'lax'
    ? envSameSite
    : 'lax';

const envSecure = process.env.REFRESH_TOKEN_COOKIE_SECURE;
export const REFRESH_TOKEN_COOKIE_SECURE =
  envSecure === 'true'
    ? true
    : envSecure === 'false'
      ? false
      : process.env.NODE_ENV === 'production';

export const PORT = parseNumber(process.env.PORT, 3000);
