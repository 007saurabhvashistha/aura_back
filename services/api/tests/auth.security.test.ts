import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} from '../src/utils/tokens.js';

describe('password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Password123!');
    expect(hash).not.toBe('Password123!');
    expect(await verifyPassword('Password123!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});

describe('tokens', () => {
  it('round-trips an access token', () => {
    const token = signAccessToken('user-1', 'a@b.com');
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
    expect(payload.type).toBe('access');
  });

  it('round-trips a refresh token', () => {
    const token = signRefreshToken('user-1', 'jti-1');
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.jti).toBe('jti-1');
    expect(payload.type).toBe('refresh');
  });

  it('rejects an access token used as a refresh token', () => {
    const token = signAccessToken('user-1', 'a@b.com');
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('produces a stable hash for a token', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });
});
