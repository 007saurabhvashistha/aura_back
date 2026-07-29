import { randomUUID } from 'node:crypto';
import type { AuthResponse, AuthTokens, UserProfile } from '@aura/shared';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http_error.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/tokens.js';
import type { UserRow } from '../../db/schema.js';
import { logger } from '../../utils/logger.js';
import { authRepository } from './auth.repository.js';
import type { LoginInput, SignupInput } from './auth.schemas.js';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Map a database row to the public user profile (drops the password hash). */
function toProfile(user: UserRow): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** Issue a fresh access + refresh token pair and persist the refresh token. */
async function issueTokens(user: UserRow): Promise<AuthTokens> {
  const jti = randomUUID();
  const refreshToken = signRefreshToken(user.id, jti);

  await authRepository.createRefreshToken({
    id: jti,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  return {
    accessToken: signAccessToken(user.id, user.email),
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };
}

export const authService = {
  async signup(input: SignupInput): Promise<AuthResponse> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      logger.warn('auth.signup.rejected', { event: 'auth.signup.rejected', email: input.email, reason: 'email_taken' });
      throw HttpError.conflict('An account with this email already exists', 'email_taken');
    }

    const user = await authRepository.createUser({
      email: input.email,
      passwordHash: await hashPassword(input.password),
      name: input.name ?? null,
    });

    logger.info('auth.signup.success', { event: 'auth.signup.success', userId: user.id, email: user.email });
    return { user: toProfile(user), tokens: await issueTokens(user) };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findUserByEmail(input.email);
    // Always run a comparison to reduce user-enumeration timing differences.
    const ok = user
      ? await verifyPassword(input.password, user.passwordHash)
      : await verifyPassword(input.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinva');
    if (!user || !ok) {
      logger.warn('auth.login.failure', { event: 'auth.login.failure', email: input.email, reason: 'invalid_credentials' });
      throw HttpError.unauthorized('Invalid email or password', 'invalid_credentials');
    }

    logger.info('auth.login.success', { event: 'auth.login.success', userId: user.id, email: user.email });
    return { user: toProfile(user), tokens: await issueTokens(user) };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw HttpError.unauthorized('Invalid or expired refresh token', 'invalid_refresh');
    }

    const stored = await authRepository.findActiveRefreshToken(payload.jti);
    if (!stored || stored.tokenHash !== hashToken(refreshToken)) {
      throw HttpError.unauthorized('Refresh token is no longer valid', 'invalid_refresh');
    }
    if (stored.expiresAt.getTime() < Date.now()) {
      throw HttpError.unauthorized('Refresh token has expired', 'expired_refresh');
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user) {
      throw HttpError.unauthorized('User no longer exists', 'invalid_refresh');
    }

    // Rotation: revoke the used token before issuing a new pair.
    await authRepository.revokeRefreshToken(stored.id);
    logger.info('auth.token.refresh', { event: 'auth.token.refresh', userId: user.id, revokedJti: stored.id });
    return issueTokens(user);
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await authRepository.revokeRefreshToken(payload.jti);
      logger.info('auth.logout', { event: 'auth.logout', userId: payload.sub, revokedJti: payload.jti });
    } catch {
      // Logout is idempotent — an invalid token is treated as already logged out.
    }
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw HttpError.notFound('User not found', 'user_not_found');
    }
    return toProfile(user);
  },
};
