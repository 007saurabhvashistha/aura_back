import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../src/modules/admin/admin.repository.js', () => {
  const sessions = new Map<string, Record<string, unknown>>();

  const now = () => new Date();

  const adminSessionRepository = {
    async createSession(data: {
      userId: string;
      ipAddress?: string | null;
      userAgent?: string | null;
    }) {
      const row = {
        id: globalThis.crypto.randomUUID(),
        userId: data.userId,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        loggedInAt: now(),
        lastActivityAt: now(),
        loggedOutAt: null,
        createdAt: now(),
      };
      sessions.set(row.id, row);
      return row;
    },

    async getActiveSession(sessionId: string) {
      const row = sessions.get(sessionId);
      return row && row.loggedOutAt === null ? row : undefined;
    },

    async getActiveSessionsByUserId(userId: string) {
      return [...sessions.values()].filter((row) => row.userId === userId && row.loggedOutAt === null);
    },

    async updateLastActivity(sessionId: string) {
      const row = sessions.get(sessionId);
      if (!row) return undefined;
      row.lastActivityAt = now();
      return row;
    },

    async logoutSession(sessionId: string) {
      const row = sessions.get(sessionId);
      if (!row) return undefined;
      row.loggedOutAt = now();
      return row;
    },

    async logoutAllSessions(userId: string) {
      let count = 0;
      for (const row of sessions.values()) {
        if (row.userId === userId && row.loggedOutAt === null) {
          row.loggedOutAt = now();
          count += 1;
        }
      }
      return count;
    },

    __reset() {
      sessions.clear();
    },
  };

  return { adminSessionRepository };
});

const { adminService } = await import('../src/modules/admin/admin.service.js');
const { rowToAdminSession } = await import('../src/modules/admin/admin.types.js');
const { signAccessToken } = await import('../src/utils/tokens.js');
const { createApp } = await import('../src/app.js');

const { adminSessionRepository } = (await import(
  '../src/modules/admin/admin.repository.js'
)) as unknown as {
  adminSessionRepository: {
    __reset: () => void;
  };
};

beforeEach(() => {
  adminSessionRepository.__reset();
});

describe('adminService.createAdminSession', () => {
  it('rejects non-admin roles with 403', async () => {
    await expect(adminService.createAdminSession('user-1', 'user')).rejects.toMatchObject({
      statusCode: 403,
      code: 'admin_required',
    });
  });

  it('creates a session for an admin user', async () => {
    const session = await adminService.createAdminSession('admin-1', 'admin', '127.0.0.1', 'vitest');
    expect(session.userId).toBe('admin-1');
    expect(session.isActive).toBe(true);
    expect(session.ipAddress).toBe('127.0.0.1');
  });
});

describe('adminService.verifyAdminSession', () => {
  it('throws when the session does not exist', async () => {
    await expect(adminService.verifyAdminSession('missing', 'admin-1')).rejects.toMatchObject({
      statusCode: 403,
      code: 'session_expired',
    });
  });

  it('throws when the session belongs to another user', async () => {
    const session = await adminService.createAdminSession('admin-1', 'admin');
    await expect(adminService.verifyAdminSession(session.id, 'admin-2')).rejects.toMatchObject({
      statusCode: 403,
      code: 'session_invalid',
    });
  });

  it('updates last activity on success', async () => {
    const session = await adminService.createAdminSession('admin-1', 'admin');
    const before = session.lastActivityAt;
    await new Promise((r) => setTimeout(r, 5));
    const verified = await adminService.verifyAdminSession(session.id, 'admin-1');
    expect(new Date(verified.lastActivityAt).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    );
  });
});

describe('adminService.logoutAdminSession', () => {
  it('is a no-op when the session is already closed or missing', async () => {
    await expect(adminService.logoutAdminSession('missing', 'admin-1')).resolves.toBeUndefined();
  });

  it('rejects logging out another user session', async () => {
    const session = await adminService.createAdminSession('admin-1', 'admin');
    await expect(adminService.logoutAdminSession(session.id, 'admin-2')).rejects.toMatchObject({
      statusCode: 403,
      code: 'unauthorized',
    });
  });
});

describe('adminService session listing and bulk logout', () => {
  it('returns only active sessions for the user', async () => {
    const a = await adminService.createAdminSession('admin-1', 'admin');
    const b = await adminService.createAdminSession('admin-1', 'admin');
    await adminService.createAdminSession('admin-2', 'admin');

    await adminService.logoutAdminSession(a.id, 'admin-1');
    const active = await adminService.getActiveSessionsForUser('admin-1');
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe(b.id);
  });

  it('logs out all active sessions for the user', async () => {
    await adminService.createAdminSession('admin-1', 'admin');
    await adminService.createAdminSession('admin-1', 'admin');
    await adminService.createAdminSession('admin-2', 'admin');

    const count = await adminService.logoutAllSessions('admin-1');
    expect(count).toBe(2);
    const active = await adminService.getActiveSessionsForUser('admin-1');
    expect(active).toHaveLength(0);
  });
});

describe('AdminSession types', () => {
  it('rowToAdminSession maps dates to ISO strings', () => {
    const row = {
      id: 's1',
      userId: 'u1',
      ipAddress: null,
      userAgent: null,
      loggedInAt: new Date('2026-01-01T00:00:00.000Z'),
      lastActivityAt: new Date('2026-01-01T00:01:00.000Z'),
      loggedOutAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const session = rowToAdminSession(row);
    expect(session.loggedInAt).toBe('2026-01-01T00:00:00.000Z');
    expect(session.lastActivityAt).toBe('2026-01-01T00:01:00.000Z');
    expect(session.isActive).toBe(true);
  });
});

describe('admin route authorization', () => {
  const app = createApp();

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/admin/verify?sessionId=x');
    expect(res.status).toBe(401);
    expect(res.body.errors[0].code).toBe('unauthorized');
  });

  it('returns 403 for non-admin token', async () => {
    const token = signAccessToken('user-1', 'user@aura.dev', 'user');
    const res = await request(app)
      .get('/api/v1/admin/verify?sessionId=x')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.errors[0].code).toBe('insufficient_permissions');
  });

  it('supports admin session lifecycle endpoints for admin token', async () => {
    const token = signAccessToken('admin-1', 'admin@aura.dev', 'admin');

    const login = await request(app)
      .post('/api/v1/admin/login')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(login.status).toBe(200);
    const sessionId = login.body.data.session.id as string;

    const verify = await request(app)
      .get(`/api/v1/admin/verify?sessionId=${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(verify.status).toBe(200);

    const sessions = await request(app)
      .get('/api/v1/admin/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(sessions.status).toBe(200);
    expect(sessions.body.data.total).toBeGreaterThanOrEqual(1);

    const logout = await request(app)
      .post('/api/v1/admin/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });
    expect(logout.status).toBe(200);

    const verifyAfterLogout = await request(app)
      .get(`/api/v1/admin/verify?sessionId=${sessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(verifyAfterLogout.status).toBe(403);
    expect(verifyAfterLogout.body.errors[0].code).toBe('session_expired');
  });
});
