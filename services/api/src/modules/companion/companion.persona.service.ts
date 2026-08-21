import { eq } from 'drizzle-orm';
import { agents, companionPersonas, type AgentRow } from '../../db/schema.js';
import { requireCompanionDb } from './companion.db.js';
import type { UpsertPersonaInput } from './companion.schemas.js';
import { rowToPersona, type CompanionPersona } from './companion.types.js';

/**
 * Persona resolution.
 *
 * Source of truth order:
 *   1. companion_personas row (explicit character definition)
 *   2. agents.metadata (values authored through the existing agent builder)
 *   3. safe defaults
 *
 * Nothing here is duplicated into a second registry: the agent still owns the model,
 * status and name; this only owns character.
 */

function metadataArray(metadata: Record<string, unknown>, key: string): string[] {
  const value = metadata[key];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function metadataString(metadata: Record<string, unknown>, key: string, fallback: string): string {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function personaFromAgent(agent: AgentRow): CompanionPersona {
  const metadata = (agent.metadata ?? {}) as Record<string, unknown>;
  const replyLengthRaw = metadataString(metadata, 'replyLength', 'short');
  return {
    agentId: agent.id,
    personality: metadataArray(metadata, 'personality'),
    traits: metadataArray(metadata, 'traits'),
    preferences: metadataArray(metadata, 'goals'),
    boundaries: metadataArray(metadata, 'restrictions'),
    backstory: metadataString(metadata, 'backstory', agent.description ?? ''),
    relationshipStyle: metadataString(metadata, 'relationshipStyle', 'friendly'),
    speakingStyle: {
      languageMode: metadataString(metadata, 'language', 'english'),
      tone: metadataString(metadata, 'tone', 'warm'),
      replyLength: replyLengthRaw === 'medium' || replyLengthRaw === 'long' ? replyLengthRaw : 'short',
      examples: metadataArray(metadata, 'conversationRules'),
    },
  };
}

export const companionPersonaService = {
  async getByAgentId(agentId: string): Promise<CompanionPersona | null> {
    const db = requireCompanionDb();
    const [row] = await db
      .select()
      .from(companionPersonas)
      .where(eq(companionPersonas.agentId, agentId))
      .limit(1);
    if (row) return rowToPersona(row);

    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
    return agent ? personaFromAgent(agent) : null;
  },

  async upsert(agentId: string, input: UpsertPersonaInput): Promise<CompanionPersona> {
    const db = requireCompanionDb();
    const values = {
      agentId,
      personality: input.personality,
      traits: input.traits,
      preferences: input.preferences,
      boundaries: input.boundaries,
      speakingExamples: input.speakingExamples,
      backstory: input.backstory,
      languageMode: input.languageMode,
      tone: input.tone,
      replyLength: input.replyLength,
      relationshipStyle: input.relationshipStyle,
      updatedAt: new Date(),
    };

    const [row] = await db
      .insert(companionPersonas)
      .values(values)
      .onConflictDoUpdate({ target: companionPersonas.agentId, set: values })
      .returning();

    return rowToPersona(row);
  },
};
