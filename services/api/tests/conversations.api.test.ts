import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const USER_EMAIL = 'ada@aura.dev';

process.env.LIVEKIT_URL = 'wss://livekit.local';
process.env.LIVEKIT_API_KEY = 'key';
process.env.LIVEKIT_API_SECRET = 'secret';

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
  let isAgeVerified = true;
  let displayName = 'Ada';
  let primaryLanguage = 'en';

  const profileRepository = {
    async ensureProfile() {
      const now = new Date();
      return {
        id: globalThis.crypto.randomUUID(),
        userId: USER_ID,
        displayName,
        bio: null,
        avatarUrl: null,
        primaryLanguage,
        communicationStyle: 'playful',
        aiPersonality: 'warm',
        preferences: { humor: true },
        isAgeVerified,
        ageVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      };
    },
    async findLanguages() {
      return [{ id: globalThis.crypto.randomUUID(), userId: USER_ID, languageCode: 'en', proficiency: 'native', createdAt: new Date() }];
    },
    async findInterests() {
      return [{ id: globalThis.crypto.randomUUID(), userId: USER_ID, interest: 'music', createdAt: new Date() }];
    },
    __setOnboarding(next: { ageVerified?: boolean; displayName?: string | null; primaryLanguage?: string | null }) {
      if (next.ageVerified !== undefined) isAgeVerified = next.ageVerified;
      if (next.displayName !== undefined) displayName = next.displayName as string;
      if (next.primaryLanguage !== undefined) primaryLanguage = next.primaryLanguage as string;
    },
  };

  return { profileRepository };
});

vi.mock('../src/providers/realtime/livekit.provider.js', () => {
  const livekitRealtimeProvider = {
    async createParticipantToken(input: { roomName: string }) {
      return {
        url: process.env.LIVEKIT_URL,
        roomName: input.roomName,
        token: 'livekit-test-token',
      };
    },
  };
  return { livekitRealtimeProvider };
});

vi.mock('../src/modules/conversations/conversations.repository.js', () => {
  const conversations = new Map<string, Record<string, unknown>>();
  const messages = new Map<string, Array<Record<string, unknown>>>();

  const repository = {
    async createConversation(input: Record<string, unknown>) {
      const now = new Date();
      const row = {
        id: globalThis.crypto.randomUUID(),
        userId: input.userId,
        agentKey: input.agentKey,
        livekitRoomName: input.livekitRoomName,
        status: input.status,
        startedAt: input.startedAt,
        endedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      conversations.set(row.id as string, row);
      messages.set(row.id as string, []);
      return row;
    },
    async listConversationsByUser(userId: string, limit: number) {
      return Array.from(conversations.values())
        .filter((c) => c.userId === userId)
        .slice(0, limit);
    },
    async findConversationForUser(userId: string, id: string) {
      const row = conversations.get(id);
      if (!row || row.userId !== userId) return undefined;
      return row;
    },
    async updateConversationStatus(id: string, status: string, patch: Record<string, unknown> = {}) {
      const row = conversations.get(id) as Record<string, unknown>;
      const next = {
        ...row,
        status,
        ...patch,
        updatedAt: new Date(),
      };
      conversations.set(id, next);
      return next;
    },
    async countLiveUserConversations(userId: string) {
      return Array.from(conversations.values()).filter(
        (c) => c.userId === userId && !c.endedAt,
      ).length;
    },
    async addMessage(input: Record<string, unknown>) {
      const row = {
        id: globalThis.crypto.randomUUID(),
        ...input,
        createdAt: new Date(),
      };
      const bucket = messages.get(input.conversationId as string) ?? [];
      bucket.push(row);
      messages.set(input.conversationId as string, bucket);
      return row;
    },
    async listMessages(conversationId: string) {
      return messages.get(conversationId) ?? [];
    },
    __reset() {
      conversations.clear();
      messages.clear();
    },
  };

  return { conversationsRepository: repository };
});

const { createApp } = await import('../src/app.js');
const { signAccessToken } = await import('../src/utils/tokens.js');
const { profileRepository } = (await import('../src/modules/profile/profile.repository.js')) as unknown as {
  profileRepository: { __setOnboarding: (next: { ageVerified?: boolean; displayName?: string | null; primaryLanguage?: string | null }) => void };
};
const { conversationsRepository } = (await import('../src/modules/conversations/conversations.repository.js')) as unknown as {
  conversationsRepository: { __reset: () => void };
};

const app = createApp();
const BASE = '/api/v1/conversations';
const token = signAccessToken(USER_ID, USER_EMAIL);
const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

beforeEach(() => {
  conversationsRepository.__reset();
  profileRepository.__setOnboarding({ ageVerified: true, displayName: 'Ada', primaryLanguage: 'en' });
});

describe('POST /conversations', () => {
  it('creates a conversation and returns LiveKit connection data', async () => {
    const res = await auth(request(app).post(BASE).send({ agentKey: 'aura_default' }));
    expect(res.status).toBe(201);
    expect(res.body.data.conversation.id).toBeTruthy();
    expect(res.body.data.conversation.status).toBe('created');
    expect(res.body.data.livekit.token).toBe('livekit-test-token');
    expect(res.body.data.livekit.roomName).toContain('conv_');
  });

  it('rejects unknown agent keys', async () => {
    const res = await auth(request(app).post(BASE).send({ agentKey: 'unknown' }));
    expect(res.status).toBe(400);
    expect(res.body.errors[0].code).toBe('unknown_agent_key');
  });

  it('rejects users who did not pass age verification', async () => {
    profileRepository.__setOnboarding({ ageVerified: false });
    const res = await auth(request(app).post(BASE).send({ agentKey: 'aura_default' }));
    expect(res.status).toBe(403);
    expect(res.body.errors[0].code).toBe('age_not_verified');
  });
});

describe('GET /conversations', () => {
  it('lists the authenticated user conversations', async () => {
    await auth(request(app).post(BASE).send({ agentKey: 'aura_default' }));
    const res = await auth(request(app).get(BASE));
    expect(res.status).toBe(200);
    expect(res.body.data.conversations).toHaveLength(1);
  });
});

describe('GET /conversations/:id', () => {
  it('returns conversation detail with short-term messages', async () => {
    const created = await auth(request(app).post(BASE).send({ agentKey: 'aura_default' }));
    const id = created.body.data.conversation.id as string;
    const res = await auth(request(app).get(`${BASE}/${id}`));
    expect(res.status).toBe(200);
    expect(res.body.data.conversation.id).toBe(id);
    expect(Array.isArray(res.body.data.messages)).toBe(true);
  });
});

describe('POST /conversations/:id/end', () => {
  it('marks a conversation completed', async () => {
    const created = await auth(request(app).post(BASE).send({ agentKey: 'aura_default' }));
    const id = created.body.data.conversation.id as string;

    const ended = await auth(request(app).post(`${BASE}/${id}/end`));
    expect(ended.status).toBe(200);
    expect(ended.body.data.conversation.status).toBe('completed');
    expect(ended.body.data.conversation.endedAt).toBeTruthy();
  });
});
