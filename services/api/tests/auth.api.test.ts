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
  it('creates an account and returns tokens without the password hash', async () => {
    const res = await request(app).post(`${AUTH}/signup`).send(creds);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ada@aura.dev');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    expect(res.body.data.tokens.refreshToken).toBeTruthy();
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

describe('POST /auth/refresh (rotation)', () => {
  it('rotates tokens and rejects reuse of the old refresh token', async () => {
    const signup = await request(app).post(`${AUTH}/signup`).send(creds);
    const oldRefresh = signup.body.data.tokens.refreshToken;

    const refreshed = await request(app).post(`${AUTH}/refresh`).send({ refreshToken: oldRefresh });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.accessToken).toBeTruthy();
    expect(refreshed.body.data.refreshToken).not.toBe(oldRefresh);

    const reuse = await request(app).post(`${AUTH}/refresh`).send({ refreshToken: oldRefresh });
    expect(reuse.status).toBe(401);
    expect(reuse.body.errors[0].code).toBe('invalid_refresh');
  });

  it('rejects a malformed refresh token with 401', async () => {
    const res = await request(app).post(`${AUTH}/refresh`).send({ refreshToken: 'garbage-token' });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('revokes the refresh token so it can no longer be used', async () => {
    const signup = await request(app).post(`${AUTH}/signup`).send(creds);
    const refreshToken = signup.body.data.tokens.refreshToken;

    const logout = await request(app).post(`${AUTH}/logout`).send({ refreshToken });
    expect(logout.status).toBe(200);

    const afterLogout = await request(app).post(`${AUTH}/refresh`).send({ refreshToken });
    expect(afterLogout.status).toBe(401);
  });
});
