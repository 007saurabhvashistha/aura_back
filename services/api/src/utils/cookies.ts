import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';

/** Name of the httpOnly refresh-token cookie. */
export const REFRESH_COOKIE_NAME = 'refresh_token';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cookie options for the refresh token.
 *
 * - httpOnly: never readable from JavaScript (mitigates XSS token theft).
 * - secure: required over HTTPS in production; disabled in dev (http).
 * - sameSite: 'none' in production (cross-site front/back), 'lax' in dev where
 *   the Vite proxy makes requests same-origin.
 * - path: scoped to the auth namespace so it is only sent to refresh/logout.
 */
function refreshCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
  };
}

/** Set the refresh token as an httpOnly cookie. */
export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions(),
    maxAge: REFRESH_TTL_MS,
  });
}

/** Clear the refresh cookie (logout). Options must match those used to set it. */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
}
