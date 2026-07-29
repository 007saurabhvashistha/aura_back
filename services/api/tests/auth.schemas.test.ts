import { describe, it, expect } from 'vitest';
import { signupSchema, loginSchema, refreshSchema } from '../src/modules/auth/auth.schemas.js';

describe('auth schemas', () => {
  it('accepts a valid signup and normalizes the email', () => {
    const parsed = signupSchema.parse({
      email: '  User@Aura.DEV ',
      password: 'Password123!',
      name: '  Ada ',
    });
    expect(parsed.email).toBe('user@aura.dev');
    expect(parsed.name).toBe('Ada');
  });

  it('rejects short passwords', () => {
    expect(() => signupSchema.parse({ email: 'a@b.com', password: 'short' })).toThrow();
  });

  it('rejects invalid emails on login', () => {
    expect(() => loginSchema.parse({ email: 'nope', password: 'x' })).toThrow();
  });

  it('requires a refresh token', () => {
    expect(() => refreshSchema.parse({ refreshToken: '' })).toThrow();
  });
});
