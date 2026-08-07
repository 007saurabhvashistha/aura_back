import type {
  AgentConfig,
  Conversation,
  ConversationDetailResponse,
  ConversationListResponse,
  ConversationMessageRole,
  ConversationMessage,
  ConversationStatus,
  ConversationStartResponse,
} from '@aura/shared';
import { HttpError } from '../../utils/http_error.js';
import { logger } from '../../utils/logger.js';
import { authRepository } from '../auth/auth.repository.js';
import { profileRepository } from '../profile/profile.repository.js';
import { agentConfigService } from './agent-config.service.js';
import { conversationMemory } from './conversation.memory.js';
import { conversationsRepository } from './conversations.repository.js';
import type { CreateConversationInput } from './conversations.schemas.js';
import { livekitRealtimeProvider } from '../../providers/realtime/livekit.provider.js';
import { env } from '../../config/env.js';
import type { ConversationMessageRow, ConversationRow } from '../../db/schema.js';

function toConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.userId,
    agentKey: row.agentKey,
    livekitRoomName: row.livekitRoomName,
    status: row.status as ConversationStatus,
    startedAt: row.startedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMessage(row: ConversationMessageRow): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role as ConversationMessageRole,
    content: row.content,
    sequence: row.sequence,
    createdAt: row.createdAt.toISOString(),
  };
}

function roomName(userId: string): string {
  return `conv_${userId.slice(0, 8)}_${globalThis.crypto.randomUUID().slice(0, 8)}`;
}

function assertOnboardingEligible(profile: {
  isAgeVerified: boolean;
  displayName: string | null;
  primaryLanguage: string | null;
}): void {
  if (!profile.isAgeVerified) {
    throw new HttpError(403, 'Age verification is required before starting a conversation', 'age_not_verified');
  }
  if (!profile.displayName || !profile.primaryLanguage) {
    throw HttpError.badRequest('Onboarding is incomplete', 'onboarding_incomplete');
  }
}

async function ensureUser(userId: string): Promise<{ id: string; email: string; name: string | null }> {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw HttpError.notFound('User not found', 'user_not_found');
  }
  return user;
}

function buildAgentContext(input: {
  profile: Awaited<ReturnType<typeof profileRepository.ensureProfile>>;
  languages: Awaited<ReturnType<typeof profileRepository.findLanguages>>;
  interests: Awaited<ReturnType<typeof profileRepository.findInterests>>;
  agent: AgentConfig;
}): Record<string, unknown> {
  return {
    agent: {
      key: input.agent.key,
      personality: input.agent.personality,
      voice: input.agent.voice,
      languageMode: input.agent.languageMode,
    },
    user: {
      displayName: input.profile.displayName,
      primaryLanguage: input.profile.primaryLanguage,
      communicationStyle: input.profile.communicationStyle,
      aiPersonality: input.profile.aiPersonality,
      preferences: input.profile.preferences,
      languages: input.languages.map((l) => ({ code: l.languageCode, proficiency: l.proficiency })),
      interests: input.interests.map((i) => i.interest),
    },
  };
}

async function enforceConversationLimits(userId: string): Promise<void> {
  const activeCount = await conversationsRepository.countLiveUserConversations(userId);
  if (activeCount >= env.CONVERSATION_MAX_CONCURRENT_SESSIONS) {
    throw new HttpError(429, 'Too many active conversations', 'conversation_concurrency_limit');
  }
}

function assertLiveKitConfigured(): void {
  if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) {
    throw new HttpError(503, 'LiveKit is not configured', 'livekit_not_configured');
  }
}

export const conversationsService = {
  async start(userId: string, input: CreateConversationInput): Promise<ConversationStartResponse> {
    const user = await ensureUser(userId);
    const [profile, languages, interests] = await Promise.all([
      profileRepository.ensureProfile(userId),
      profileRepository.findLanguages(userId),
      profileRepository.findInterests(userId),
    ]);

    assertOnboardingEligible(profile);
    await enforceConversationLimits(userId);
    assertLiveKitConfigured();

    const agent = agentConfigService.getByKey(input.agentKey);

    const created = await conversationsRepository.createConversation({
      userId,
      agentKey: agent.key,
      livekitRoomName: roomName(userId),
      status: 'created',
      startedAt: new Date(),
    });

    const token = await livekitRealtimeProvider.createParticipantToken({
      roomName: created.livekitRoomName,
      participantIdentity: userId,
      participantName: profile.displayName ?? user.name ?? user.email,
      canPublishAudio: true,
      canSubscribe: true,
      canPublishData: false,
    });

    const context = buildAgentContext({ profile, languages, interests, agent });
    await conversationsRepository.addMessage({
      conversationId: created.id,
      role: 'system',
      content: JSON.stringify({
        systemPrompt: agent.systemPrompt,
        context,
      }),
      sequence: 0,
    });

    logger.info('conversation.started', {
      event: 'conversation.started',
      conversationId: created.id,
      userId,
      agentKey: agent.key,
    });

    return {
      conversation: {
        id: created.id,
        status: created.status as ConversationStatus,
      },
      livekit: {
        url: token.url,
        roomName: token.roomName,
        token: token.token,
      },
      agent: {
        key: agent.key,
        name: agent.name,
        personality: agent.personality,
        voice: agent.voice,
      },
    };
  },

  async list(userId: string, limit: number): Promise<ConversationListResponse> {
    await ensureUser(userId);
    const rows = await conversationsRepository.listConversationsByUser(userId, limit);
    return { conversations: rows.map(toConversation) };
  },

  async get(userId: string, id: string): Promise<ConversationDetailResponse> {
    await ensureUser(userId);
    const conversation = await conversationsRepository.findConversationForUser(userId, id);
    if (!conversation) {
      throw HttpError.notFound('Conversation not found', 'conversation_not_found');
    }
    const messages = await conversationsRepository.listMessages(id);
    return {
      conversation: toConversation(conversation),
      messages: conversationMemory.shortTerm(messages.map(toMessage)),
    };
  },

  async end(userId: string, id: string): Promise<Conversation> {
    await ensureUser(userId);
    const conversation = await conversationsRepository.findConversationForUser(userId, id);
    if (!conversation) {
      throw HttpError.notFound('Conversation not found', 'conversation_not_found');
    }
    if (conversation.endedAt || conversation.status === 'completed') {
      return toConversation(conversation);
    }

    const now = new Date();
    const maxMs = env.CONVERSATION_MAX_DURATION_MINUTES * 60 * 1000;
    if (conversation.startedAt && now.getTime() - conversation.startedAt.getTime() > maxMs) {
      await conversationsRepository.updateConversationStatus(id, 'failed', { endedAt: now });
      throw new HttpError(408, 'Conversation exceeded max duration', 'conversation_timed_out');
    }

    await conversationsRepository.updateConversationStatus(id, 'ending');
    const ended = await conversationsRepository.updateConversationStatus(id, 'completed', {
      endedAt: now,
    });

    const messages = await conversationsRepository.listMessages(id);
    logger.info('conversation.ended', {
      event: 'conversation.ended',
      conversationId: id,
      userId,
      durationMs:
        ended.startedAt && ended.endedAt
          ? ended.endedAt.getTime() - ended.startedAt.getTime()
          : null,
      turnCount: messages.filter((m) => m.role !== 'system').length,
      memoryCandidates: conversationMemory.extractCandidates(messages.map(toMessage)).length,
    });

    return toConversation(ended);
  },
};
