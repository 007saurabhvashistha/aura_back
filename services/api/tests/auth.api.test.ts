import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

/**
 * CI-safe integration tests: the repository is replaced with an in-memory
 * store so the full route -> controller -> service -> repository path runs
 * (including real bcrypt hashing and JWT signing/verification) without a
 * database connection.
 */
vi.mock('../src/modules/auth/auth.repository.js', () => {
  const usersById = new Map<string, Record<string, unknown>>();
  const usersByEmail = new Map<string, Record<string, unknown>>();
  const tokens = new Map<string, Record<string, unknown>>();

  const authRepository = {
    async findUserByEmail(email: string) {
      return usersByEmail.get(email);
    },
    async findUserById(id: string) {
      return usersById.get(id);
    },
    async createUser(data: { email: string; passwordHash: string; name: string | null }) {
      const now = new Date();
      const row = { id: globalThis.crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
      usersById.set(row.id, row);
      usersByEmail.set(row.email, row);
      return row;
    },
    async createRefreshToken(data: Record<string, unknown>) {
      const row = { revokedAt: null, createdAt: new Date(), ...data };
      tokens.set(row.id as string, row);
      return row;
    },
    async findActiveRefreshToken(id: string) {
      const row = tokens.get(id);
      return row && !row.revokedAt ? row : undefined;
    },
    async revokeRefreshToken(id: string) {
      const row = tokens.get(id);
      if (row) row.revokedAt = new Date();
    },
    // Test-only helper to reset state between tests.
    __reset() {
      usersById.clear();
      usersByEmail.clear();
      tokens.clear();
    },
  };

  return { authRepository };
});

// Import after the mock is registered.
const { createApp } = await import('../src/app.js');
const { authRepository } = (await import('../src/modules/auth/auth.repository.js')) as unknown as {
  authRepository: { __reset: () => void };
};

const app = createApp();
const AUTH = '/api/v1/auth';
const creds = { email: 'ada@aura.dev', password: 'Password123!', name: 'Ada' };

beforeEach(() => {
  authRepository.__reset();
});

describe('POST /auth/signup', () => {
  it('creates an account and returns an access token without the password hash', async () => {
    const res = await request(app).post(`${AUTH}/signup`).send(creds);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ada@aura.dev');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    // Refresh token is delivered as an httpOnly cookie, never in the body.
    expect(res.body.data.tokens).not.toHaveProperty('refreshToken');
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith('refresh_token='))).toBe(true);
    expect(setCookie.some((c) => c.toLowerCase().includes('httponly'))).toBe(true);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post(`${AUTH}/signup`).send(creds);
    const res = await request(app).post(`${AUTH}/signup`).send(creds);
    expect(res.status).toBe(409);
    expect(res.body.errors[0].code).toBe('email_taken');
  });

  it('rejects invalid input with 422', async () => {
    const res = await request(app).post(`${AUTH}/signup`).send({ email: 'nope', password: '123' });
    expect(res.status).toBe(422);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${AUTH}/signup`).send(creds);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: creds.email, password: creds.password });
    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeTruthy();
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: creds.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(res.body.errors[0].code).toBe('invalid_credentials');
  });

  it('rejects an unknown email with 401', async () => {
    const res = await request(app)
      .post(`${AUTH}/login`)
      .send({ email: 'ghost@aura.dev', password: 'Password123!' });
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`${AUTH}/me`);
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await request(app).get(`${AUTH}/me`).set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns the profile with a valid token', async () => {
    const signup = await request(app).post(`${AUTH}/signup`).send(creds);
    const token = signup.body.data.tokens.accessToken;
    const res = await request(app).get(`${AUTH}/me`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(creds.email);
  });
});

/** Extract the refresh_token cookie value(s) from a response for reuse. */
function refreshCookie(res: request.Response): string[] {
  return (res.headers['set-cookie'] as unknown as string[]).filter((c) =>
    c.startsWith('refresh_token='),
  );
}

describe('POST /auth/refresh (rotation)', () => {
  it('rotates tokens and rejects reuse of the old refresh cookie', async () => {
    const signup = await request(app).post(`${AUTH}/signup`).send(creds);
    const oldCookie = refreshCookie(signup);

    const refreshed = await request(app).post(`${AUTH}/refresh`).set('Cookie', oldCookie);
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();
    const newCookie = refreshCookie(refreshed);
    expect(newCookie[0]).not.toBe(oldCookie[0]);

    const reuse = await request(app).post(`${AUTH}/refresh`).set('Cookie', oldCookie);
    expect(reuse.status).toBe(401);
    expect(reuse.body.errors[0].code).toBe('invalid_refresh');
  });

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await request(app).post(`${AUTH}/refresh`);
    expect(res.status).toBe(401);
  });

  it('rejects a malformed refresh cookie with 401', async () => {
    const res = await request(app)
      .post(`${AUTH}/refresh`)
      .set('Cookie', ['refresh_token=garbage-token']);
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('revokes the refresh token so it can no longer be used', async () => {
    const signup = await request(app).post(`${AUTH}/signup`).send(creds);
    const cookie = refreshCookie(signup);

    const logout = await request(app).post(`${AUTH}/logout`).set('Cookie', cookie);
    expect(logout.status).toBe(200);

    const afterLogout = await request(app).post(`${AUTH}/refresh`).set('Cookie', cookie);
    expect(afterLogout.status).toBe(401);
  });
});
