import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';

/**
 * CI-safe integration tests for the profile domain. The profile and auth
 * repositories are replaced with in-memory stores so the full
 * route -> controller -> service -> repository path runs (real Zod validation,
 * real JWT auth) without a database.
 */

const USER_ID = '11111111-1111-1111-1111-111111111111';
const USER_EMAIL = 'ada@aura.dev';

interface ProfileRow {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  primaryLanguage: string | null;
  communicationStyle: string | null;
  aiPersonality: string | null;
  preferences: Record<string, unknown>;
  isAgeVerified: boolean;
  ageVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

vi.mock('../src/modules/auth/auth.repository.js', () => {
  const authRepository = {
    async findUserById(id: string) {
      if (id !== USER_ID) return undefined;
      const now = new Date();
      return {
        id: USER_ID,
        email: USER_EMAIL,
        passwordHash: 'x',
        name: 'Ada',
        createdAt: now,
        updatedAt: now,
      };
    },
  };
  return { authRepository };
});

vi.mock('../src/modules/profile/profile.repository.js', () => {
  const profiles = new Map<string, ProfileRow>();
  const languages = new Map<string, Array<{ id: string; userId: string; languageCode: string; proficiency: string | null; createdAt: Date }>>();
  const interests = new Map<string, Array<{ id: string; userId: string; interest: string; createdAt: Date }>>();

  function blankProfile(userId: string): ProfileRow {
    const now = new Date();
    return {
      id: globalThis.crypto.randomUUID(),
      userId,
      displayName: null,
      bio: null,
      avatarUrl: null,
      primaryLanguage: null,
      communicationStyle: null,
      aiPersonality: null,
      preferences: {},
      isAgeVerified: false,
      ageVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  const profileRepository = {
    async findProfileByUserId(userId: string) {
      return profiles.get(userId);
    },
    async ensureProfile(userId: string) {
      let row = profiles.get(userId);
      if (!row) {
        row = blankProfile(userId);
        profiles.set(userId, row);
      }
      return row;
    },
    async updateProfile(userId: string, patch: Record<string, unknown>) {
      const row = profiles.get(userId) ?? blankProfile(userId);
      Object.assign(row, patch, { updatedAt: new Date() });
      profiles.set(userId, row);
      return row;
    },
    async setAgeVerified(userId: string, verifiedAt: Date) {
      const row = profiles.get(userId) ?? blankProfile(userId);
      row.isAgeVerified = true;
      row.ageVerifiedAt = verifiedAt;
      row.updatedAt = new Date();
      profiles.set(userId, row);
      return row;
    },
    async setAvatarUrl(userId: string, avatarUrl: string | null) {
      const row = profiles.get(userId) ?? blankProfile(userId);
      row.avatarUrl = avatarUrl;
      row.updatedAt = new Date();
      profiles.set(userId, row);
      return row;
    },
    async findLanguages(userId: string) {
      return languages.get(userId) ?? [];
    },
    async replaceLanguages(
      userId: string,
      langs: Array<{ languageCode: string; proficiency: string }>,
    ) {
      const rows = langs.map((l) => ({
        id: globalThis.crypto.randomUUID(),
        userId,
        languageCode: l.languageCode,
        proficiency: l.proficiency,
        createdAt: new Date(),
      }));
      languages.set(userId, rows);
      return rows;
    },
    async findInterests(userId: string) {
      return interests.get(userId) ?? [];
    },
    async replaceInterests(userId: string, items: string[]) {
      const rows = items.map((interest) => ({
        id: globalThis.crypto.randomUUID(),
        userId,
        interest,
        createdAt: new Date(),
      }));
      interests.set(userId, rows);
      return rows;
    },
    __reset() {
      profiles.clear();
      languages.clear();
      interests.clear();
    },
  };
  return { profileRepository };
});

const { createApp } = await import('../src/app.js');
const { signAccessToken } = await import('../src/utils/tokens.js');
const { profileRepository } = (await import('../src/modules/profile/profile.repository.js')) as unknown as {
  profileRepository: { __reset: () => void };
};

const app = createApp();
const BASE = '/api/v1/users';
const token = signAccessToken(USER_ID, USER_EMAIL);
const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

/** Build a YYYY-MM-DD date `years` ago from today. */
function dobYearsAgo(years: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

beforeEach(() => {
  profileRepository.__reset();
});

describe('GET /users/me', () => {
  it('requires authentication', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });

  it('returns a full profile with onboarding state', async () => {
    const res = await auth(request(app).get(`${BASE}/me`));
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(USER_EMAIL);
    expect(res.body.data.onboarding.complete).toBe(false);
    expect(res.body.data).not.toHaveProperty('dateOfBirth');
    expect(JSON.stringify(res.body)).not.toContain('dateOfBirth');
  });
});

describe('PATCH /users/me', () => {
  it('updates allowed fields', async () => {
    const res = await auth(
      request(app).patch(`${BASE}/me`).send({ displayName: 'Ada L', bio: 'hi' }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.profile.displayName).toBe('Ada L');
  });

  it('rejects unknown preference keys', async () => {
    const res = await auth(
      request(app).patch(`${BASE}/me`).send({ preferences: { nope: true } }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects client-controlled isAgeVerified', async () => {
    const res = await auth(request(app).patch(`${BASE}/me`).send({ isAgeVerified: true }));
    expect(res.status).toBe(422);
  });

  it('rejects client-controlled ageVerifiedAt', async () => {
    const res = await auth(
      request(app).patch(`${BASE}/me`).send({ ageVerifiedAt: new Date().toISOString() }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects dateOfBirth in the generic PATCH', async () => {
    const res = await auth(request(app).patch(`${BASE}/me`).send({ dateOfBirth: '2000-01-01' }));
    expect(res.status).toBe(422);
  });

  it('rejects an empty patch', async () => {
    const res = await auth(request(app).patch(`${BASE}/me`).send({}));
    expect(res.status).toBe(422);
  });
});

describe('POST /users/me/age-verification', () => {
  it('verifies an 18+ user and never persists/returns/logs DOB', async () => {
    const dob = dobYearsAgo(25);
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((line) => {
      logs.push(String(line));
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation((line) => {
      logs.push(String(line));
    });

    const res = await auth(request(app).post(`${BASE}/me/age-verification`).send({ dateOfBirth: dob }));
    spy.mockRestore();
    warnSpy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body.data.isAgeVerified).toBe(true);
    expect(res.body.data.ageVerifiedAt).toBeTruthy();
    // DOB never returned.
    expect(JSON.stringify(res.body)).not.toContain(dob);
    // DOB never logged.
    expect(logs.some((l) => l.includes(dob))).toBe(false);

    // DOB never persisted: the profile carries no DOB field.
    const me = await auth(request(app).get(`${BASE}/me`));
    expect(me.body.data.profile.isAgeVerified).toBe(true);
    expect(JSON.stringify(me.body)).not.toContain(dob);
    expect(me.body.data.profile).not.toHaveProperty('dateOfBirth');
  });

  it('rejects an under-18 user with 403 age_not_eligible', async () => {
    const res = await auth(
      request(app).post(`${BASE}/me/age-verification`).send({ dateOfBirth: dobYearsAgo(15) }),
    );
    expect(res.status).toBe(403);
    expect(res.body.errors[0].code).toBe('age_not_eligible');
  });

  it('rejects a future date of birth', async () => {
    const future = new Date();
    future.setUTCFullYear(future.getUTCFullYear() + 1);
    const res = await auth(
      request(app)
        .post(`${BASE}/me/age-verification`)
        .send({ dateOfBirth: future.toISOString().slice(0, 10) }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects an invalid date of birth', async () => {
    const res = await auth(
      request(app).post(`${BASE}/me/age-verification`).send({ dateOfBirth: 'not-a-date' }),
    );
    expect(res.status).toBe(422);
  });
});

describe('languages', () => {
  it('GET returns an empty list initially', async () => {
    const res = await auth(request(app).get(`${BASE}/me/languages`));
    expect(res.status).toBe(200);
    expect(res.body.data.languages).toEqual([]);
  });

  it('PUT replaces the complete set', async () => {
    const res = await auth(
      request(app)
        .put(`${BASE}/me/languages`)
        .send({ languages: [{ languageCode: 'en', proficiency: 'native' }] }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.languages).toHaveLength(1);
  });

  it('rejects duplicate language codes', async () => {
    const res = await auth(
      request(app)
        .put(`${BASE}/me/languages`)
        .send({
          languages: [
            { languageCode: 'en', proficiency: 'native' },
            { languageCode: 'en', proficiency: 'fluent' },
          ],
        }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects unknown language codes', async () => {
    const res = await auth(
      request(app)
        .put(`${BASE}/me/languages`)
        .send({ languages: [{ languageCode: 'zz', proficiency: 'native' }] }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects more than the maximum number of languages', async () => {
    const langs = Array.from({ length: 21 }, () => ({ languageCode: 'en', proficiency: 'native' }));
    const res = await auth(request(app).put(`${BASE}/me/languages`).send({ languages: langs }));
    expect(res.status).toBe(422);
  });
});

describe('interests', () => {
  it('PUT replaces the complete set', async () => {
    const res = await auth(
      request(app).put(`${BASE}/me/interests`).send({ interests: ['music', 'gaming'] }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.interests).toEqual(['music', 'gaming']);
  });

  it('rejects free-form / unknown interests', async () => {
    const res = await auth(
      request(app).put(`${BASE}/me/interests`).send({ interests: ['made-up-interest'] }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects more than the maximum number of interests', async () => {
    const many = Array.from({ length: 51 }, () => 'music');
    const res = await auth(request(app).put(`${BASE}/me/interests`).send({ interests: many }));
    expect(res.status).toBe(422);
  });
});

describe('avatar', () => {
  it('issues a server-generated object key under the user prefix', async () => {
    const res = await auth(
      request(app)
        .post(`${BASE}/me/avatar/upload-url`)
        .send({ contentType: 'image/webp', sizeBytes: 1024 }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.objectKey.startsWith(`avatars/${USER_ID}/`)).toBe(true);
    expect(res.body.data.uploadUrl).toBeTruthy();
  });

  it('rejects an unsupported content type', async () => {
    const res = await auth(
      request(app)
        .post(`${BASE}/me/avatar/upload-url`)
        .send({ contentType: 'image/gif', sizeBytes: 1024 }),
    );
    expect(res.status).toBe(422);
  });

  it('rejects files larger than 5 MB', async () => {
    const res = await auth(
      request(app)
        .post(`${BASE}/me/avatar/upload-url`)
        .send({ contentType: 'image/png', sizeBytes: 6 * 1024 * 1024 }),
    );
    expect(res.status).toBe(422);
  });

  it('commits a valid server-issued key and rejects foreign keys', async () => {
    const issued = await auth(
      request(app)
        .post(`${BASE}/me/avatar/upload-url`)
        .send({ contentType: 'image/webp', sizeBytes: 1024 }),
    );
    const objectKey = issued.body.data.objectKey as string;

    const commit = await auth(request(app).put(`${BASE}/me/avatar`).send({ objectKey }));
    expect(commit.status).toBe(200);
    expect(commit.body.data.avatarUrl).toContain(objectKey);

    // A key belonging to another user is rejected (ownership check).
    const foreignKey =
      'avatars/22222222-2222-2222-2222-222222222222/33333333-3333-3333-3333-333333333333.webp';
    const foreign = await auth(request(app).put(`${BASE}/me/avatar`).send({ objectKey: foreignKey }));
    expect(foreign.status).toBe(400);
    expect(foreign.body.errors[0].code).toBe('invalid_object_key');
  });

  it('rejects a malformed object key', async () => {
    const res = await auth(request(app).put(`${BASE}/me/avatar`).send({ objectKey: '../etc/passwd' }));
    expect(res.status).toBe(422);
  });

  it('deletes the avatar', async () => {
    const res = await auth(request(app).delete(`${BASE}/me/avatar`));
    expect(res.status).toBe(200);
    expect(res.body.data.avatarUrl).toBeNull();
  });

  it('requires authentication for avatar endpoints', async () => {
    const res = await request(app).delete(`${BASE}/me/avatar`);
    expect(res.status).toBe(401);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
