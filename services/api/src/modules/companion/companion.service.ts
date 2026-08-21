import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { env } from '../../config/env.js';
import {
  agents,
  companionTurns,
  socialConversationMessages,
  socialConversations,
  socialProfiles,
  type AgentRow,
  type SocialProfileRow,
} from '../../db/schema.js';
import { HttpError } from '../../utils/http_error.js';
import { requireCompanionDb } from './companion.db.js';
import { companionBudgetService, currentLimits, type BudgetDecision } from './companion.budget.service.js';
import { companionEngine, type CompanionEngine } from './companion.engine.js';
import { companionMemoryService } from './companion.memory.service.js';
import { companionPersonaService } from './companion.persona.service.js';
import { companionRelationshipService } from './companion.relationship.service.js';
import {
  toCompanion,
  type Companion,
  type CompanionMemory,
  type CompanionPersona,
  type CompanionRelationship,
  type CompanionTraceStep,
} from './companion.types.js';

const FAILED_REPLY_BODY = 'Message not delivered.';
const BLOCKED_REPLY_BODY = 'This message could not be answered.';

const DEFAULT_PERSONA = (agentId: string, displayName: string): CompanionPersona => ({
  agentId,
  personality: ['attentive', 'grounded'],
  traits: [],
  preferences: [],
  boundaries: ['No medical, legal or financial advice.'],
  backstory: `${displayName} is a companion on Aura.`,
  relationshipStyle: 'friendly',
  speakingStyle: { languageMode: 'english', tone: 'warm', replyLength: 'short', examples: [] },
});

export interface CompanionTurnOutcome {
  status: 'passed' | 'failed' | 'blocked';
  provider: string;
  model: string;
  latencyMs: number;
  trace: CompanionTraceStep[];
  relationship: CompanionRelationship;
  memoriesWritten: number;
  memoriesArchived: number;
  usage: { promptTokens: number; completionTokens: number; costMicroUsd: number };
  budget: BudgetDecision;
}

async function loadAgent(agentId: string | null): Promise<AgentRow | null> {
  if (!agentId) return null;
  const db = requireCompanionDb();
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), isNull(agents.deletedAt)))
    .limit(1);
  return agent ?? null;
}

async function loadHistory(conversationId: string, ownerProfileId: string) {
  const db = requireCompanionDb();
  const rows = await db
    .select()
    .from(socialConversationMessages)
    .where(eq(socialConversationMessages.conversationId, conversationId))
    .orderBy(desc(socialConversationMessages.createdAt))
    .limit(env.COMPANION_SHORT_TERM_MESSAGES);

  return rows
    .reverse()
    .filter((row) => row.authorRole !== 'system' && row.status !== 'failed')
    .map((row) => ({
      role: row.authorProfileId === ownerProfileId ? ('user' as const) : ('assistant' as const),
      content: row.body,
    }));
}

export function createCompanionService(engine: CompanionEngine = companionEngine) {
  return {
    /** AI participants in the graph. Composed from social_profiles + agents. */
    async listCompanions(limit = 50): Promise<Companion[]> {
      const db = requireCompanionDb();
      const rows = await db
        .select({ profile: socialProfiles, agent: agents })
        .from(socialProfiles)
        .leftJoin(agents, eq(socialProfiles.agentId, agents.id))
        .where(eq(socialProfiles.entityType, 'AI'))
        .orderBy(desc(socialProfiles.followersCount))
        .limit(limit);
      return rows.map((row) => toCompanion(row.profile, row.agent));
    },

    async getCompanion(profileId: string): Promise<{ companion: Companion; profile: SocialProfileRow }> {
      const db = requireCompanionDb();
      const [profile] = await db.select().from(socialProfiles).where(eq(socialProfiles.id, profileId)).limit(1);
      if (!profile || profile.entityType !== 'AI') {
        throw HttpError.notFound('Companion not found', 'COMPANION_NOT_FOUND');
      }
      const agent = await loadAgent(profile.agentId);
      return { companion: toCompanion(profile, agent), profile };
    },

    async getPersona(profileId: string): Promise<CompanionPersona | null> {
      const { companion } = await this.getCompanion(profileId);
      return companion.agentId ? companionPersonaService.getByAgentId(companion.agentId) : null;
    },

    async getRelationship(viewerProfileId: string, profileId: string): Promise<CompanionRelationship> {
      await this.getCompanion(profileId);
      return companionRelationshipService.getOrCreate(viewerProfileId, profileId);
    },

    async listMemories(viewerProfileId: string, profileId: string, limit: number): Promise<CompanionMemory[]> {
      await this.getCompanion(profileId);
      return companionMemoryService.list(viewerProfileId, profileId, limit);
    },

    engineStatus() {
      return { ...engine.status(), limits: currentLimits() };
    },

    async usage(viewerProfileId: string, companionProfileId: string, conversationId: string) {
      return {
        limits: currentLimits(),
        today: await companionBudgetService.usageToday({ viewerProfileId, companionProfileId, conversationId }),
      };
    },

    /**
     * Full companion turn:
     * conversation -> character -> memory + relationship -> gateway -> response -> persistence.
     * The reply message, memory writes, relationship update and turn record commit together.
     */
    async respondToUserMessage(input: {
      conversationId: string;
      viewerProfileId: string;
      participant: SocialProfileRow;
      userMessage: string;
      /** Supplied by the SSE transport. Persistence is identical either way. */
      onDelta?: (delta: string) => void;
    }): Promise<CompanionTurnOutcome> {
      const db = requireCompanionDb();
      const agent = await loadAgent(input.participant.agentId);
      const companion = toCompanion(input.participant, agent);

      const [persona, relationship, memories, history, budget] = await Promise.all([
        companion.agentId
          ? companionPersonaService.getByAgentId(companion.agentId)
          : Promise.resolve(null),
        companionRelationshipService.getOrCreate(input.viewerProfileId, companion.profileId),
        companionMemoryService.list(input.viewerProfileId, companion.profileId),
        loadHistory(input.conversationId, input.viewerProfileId),
        companionBudgetService.check({
          viewerProfileId: input.viewerProfileId,
          companionProfileId: companion.profileId,
          conversationId: input.conversationId,
        }),
      ]);

      const result = await engine.generate({
        companion,
        persona: persona ?? DEFAULT_PERSONA(companion.agentId ?? '', companion.displayName),
        relationship,
        memories,
        history,
        userMessage: input.userMessage,
        budget,
        onDelta: input.onDelta,
      });

      const now = new Date();
      let memoriesWritten = 0;
      let memoriesArchived = 0;
      let nextRelationship = relationship;

      await db.transaction(async (tx) => {
        const [message] = await tx
          .insert(socialConversationMessages)
          .values({
            conversationId: input.conversationId,
            authorProfileId: result.status === 'passed' ? companion.profileId : null,
            authorRole: result.status === 'passed' ? 'participant' : 'system',
            body:
              result.status === 'passed'
                ? result.text
                : result.status === 'blocked'
                  ? BLOCKED_REPLY_BODY
                  : FAILED_REPLY_BODY,
            status: result.status === 'passed' ? 'sent' : 'failed',
            trace: result.trace,
          })
          .returning();

        await tx
          .update(socialConversations)
          .set({ lastActivityAt: now, updatedAt: now })
          .where(eq(socialConversations.id, input.conversationId));

        if (result.status === 'passed') {
          await companionMemoryService.touch(
            tx,
            memories.map((memory) => memory.id),
          );
          memoriesWritten = await companionMemoryService.write(tx, {
            viewerProfileId: input.viewerProfileId,
            companionProfileId: companion.profileId,
            sourceConversationId: input.conversationId,
            candidates: result.memoryCandidates,
            existing: memories,
          });
          nextRelationship = await companionRelationshipService.applyTurn(
            tx,
            relationship,
            result.relationshipDelta,
          );
          // Retention runs on the full active set, not just what was in context.
          memoriesArchived = await companionMemoryService.enforceRetention(
            tx,
            await companionMemoryService.listAll(input.viewerProfileId, companion.profileId),
          );
        }

        await tx.insert(companionTurns).values({
          conversationId: input.conversationId,
          messageId: message?.id ?? null,
          viewerProfileId: input.viewerProfileId,
          companionProfileId: companion.profileId,
          agentId: companion.agentId,
          provider: result.provider,
          model: result.model,
          status: result.status,
          latencyMs: result.latencyMs,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          costMicroUsd: result.usage.costMicroUsd,
          streamed: result.streamed,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          trace: result.trace,
        });
      });

      return {
        status: result.status,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        trace: result.trace,
        relationship: nextRelationship,
        memoriesWritten,
        memoriesArchived,
        usage: result.usage,
        budget,
      };
    },

    async listTurns(conversationId: string, viewerProfileId: string, limit = 20) {
      const db = requireCompanionDb();
      return db
        .select()
        .from(companionTurns)
        .where(
          and(eq(companionTurns.conversationId, conversationId), eq(companionTurns.viewerProfileId, viewerProfileId)),
        )
        .orderBy(asc(companionTurns.createdAt))
        .limit(limit);
    },
  };
}

export const companionService = createCompanionService();
export type CompanionService = ReturnType<typeof createCompanionService>;
