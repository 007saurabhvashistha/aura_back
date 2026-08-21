import { and, desc, eq, inArray } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { companionMemories } from '../../db/schema.js';
import { requireCompanionDb, clamp, type CompanionDb } from './companion.db.js';
import { decayedImportance, expiryFor, policyFor, selectForArchival } from './companion.memory.policy.js';
import { rowToMemory, type CompanionMemory, type CompanionMemoryLayer } from './companion.types.js';

const MAX_MEMORY_LENGTH = 500;

export interface MemoryCandidate {
  content: string;
  layer: CompanionMemoryLayer;
  importance: number;
}

/**
 * Write gate. Memory is never written verbatim from model output without checks:
 * trimmed, length-bounded, importance-bounded per layer, de-duplicated against what is
 * already stored, and capped per turn. This is what stops memory poisoning and unbounded
 * growth.
 */
function gate(candidates: MemoryCandidate[], existing: CompanionMemory[]): MemoryCandidate[] {
  const seen = new Set(existing.map((item) => item.content.trim().toLowerCase()));
  const accepted: MemoryCandidate[] = [];

  for (const candidate of candidates) {
    if (accepted.length >= env.COMPANION_MEMORY_MAX_PER_TURN) break;
    const content = candidate.content.trim().slice(0, MAX_MEMORY_LENGTH);
    if (content.length < 3) continue;
    const key = content.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    accepted.push({
      content,
      layer: candidate.layer,
      importance: clamp(candidate.importance, 1, policyFor(candidate.layer).maxImportance),
    });
  }

  return accepted;
}

export const companionMemoryService = {
  /**
   * Context read. Ranking uses decayed importance so stale facts sink without a
   * background job, and expired ones are never surfaced.
   */
  async list(
    viewerProfileId: string,
    companionProfileId: string,
    limit = env.COMPANION_MEMORY_CONTEXT_ITEMS,
  ): Promise<CompanionMemory[]> {
    const db = requireCompanionDb();
    const rows = await db
      .select()
      .from(companionMemories)
      .where(
        and(
          eq(companionMemories.viewerProfileId, viewerProfileId),
          eq(companionMemories.companionProfileId, companionProfileId),
          eq(companionMemories.status, 'active'),
        ),
      )
      .orderBy(desc(companionMemories.importance), desc(companionMemories.createdAt))
      .limit(Math.max(limit, env.COMPANION_MEMORY_MAX_PER_COMPANION));

    const now = Date.now();
    return rows
      .map(rowToMemory)
      .filter((memory) => decayedImportance(memory, now) > 0)
      .filter((memory) => !memory.expiresAt || new Date(memory.expiresAt).getTime() > now)
      .sort((a, b) => decayedImportance(b, now) - decayedImportance(a, now))
      .slice(0, limit);
  },

  /** Every active memory for a pair, including decayed ones. Used by retention. */
  async listAll(viewerProfileId: string, companionProfileId: string): Promise<CompanionMemory[]> {
    const db = requireCompanionDb();
    const rows = await db
      .select()
      .from(companionMemories)
      .where(
        and(
          eq(companionMemories.viewerProfileId, viewerProfileId),
          eq(companionMemories.companionProfileId, companionProfileId),
          eq(companionMemories.status, 'active'),
        ),
      );
    return rows.map(rowToMemory);
  },

  /** Persists gated candidates. Runs inside the caller's transaction. */
  async write(
    tx: CompanionDb,
    input: {
      viewerProfileId: string;
      companionProfileId: string;
      sourceConversationId: string | null;
      candidates: MemoryCandidate[];
      existing: CompanionMemory[];
    },
  ): Promise<number> {
    const accepted = gate(input.candidates, input.existing);
    if (accepted.length === 0) return 0;

    const now = new Date();
    await tx.insert(companionMemories).values(
      accepted.map((candidate) => ({
        viewerProfileId: input.viewerProfileId,
        companionProfileId: input.companionProfileId,
        layer: candidate.layer,
        content: candidate.content,
        importance: candidate.importance,
        sourceConversationId: input.sourceConversationId,
        expiresAt: expiryFor(candidate.layer, now),
        lastAccessedAt: now,
      })),
    );

    return accepted.length;
  },

  /** Marks recalled memories as fresh so actively used facts resist decay. */
  async touch(tx: CompanionDb, memoryIds: string[]): Promise<void> {
    if (memoryIds.length === 0) return;
    await tx
      .update(companionMemories)
      .set({ lastAccessedAt: new Date() })
      .where(inArray(companionMemories.id, memoryIds));
  },

  /** Applies the retention policy. Returns how many memories were archived. */
  async enforceRetention(
    tx: CompanionDb,
    memories: CompanionMemory[],
    now: number = Date.now(),
  ): Promise<number> {
    const ids = selectForArchival(memories, now);
    if (ids.length === 0) return 0;
    await tx
      .update(companionMemories)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(inArray(companionMemories.id, ids));
    return ids.length;
  },

  async archive(viewerProfileId: string, memoryId: string): Promise<void> {
    const db = requireCompanionDb();
    await db
      .update(companionMemories)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(and(eq(companionMemories.id, memoryId), eq(companionMemories.viewerProfileId, viewerProfileId)));
  },
};

export const __testing = { gate };

