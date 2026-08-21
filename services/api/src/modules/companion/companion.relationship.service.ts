import { and, eq } from 'drizzle-orm';
import { companionRelationships } from '../../db/schema.js';
import { requireCompanionDb, clamp, type CompanionDb } from './companion.db.js';
import { rowToRelationship, type CompanionRelationship } from './companion.types.js';

/** Level is derived from interaction count so it can never be set arbitrarily by a model. */
export function deriveLevel(interactionCount: number): number {
  return clamp(Math.ceil((interactionCount + 1) / 4), 1, 10);
}

export const companionRelationshipService = {
  async getOrCreate(viewerProfileId: string, companionProfileId: string): Promise<CompanionRelationship> {
    const db = requireCompanionDb();
    const [existing] = await db
      .select()
      .from(companionRelationships)
      .where(
        and(
          eq(companionRelationships.viewerProfileId, viewerProfileId),
          eq(companionRelationships.companionProfileId, companionProfileId),
        ),
      )
      .limit(1);
    if (existing) return rowToRelationship(existing);

    const [created] = await db
      .insert(companionRelationships)
      .values({ viewerProfileId, companionProfileId })
      .onConflictDoNothing({
        target: [companionRelationships.viewerProfileId, companionRelationships.companionProfileId],
      })
      .returning();
    if (created) return rowToRelationship(created);

    // Lost the race: another request created it first.
    const [row] = await db
      .select()
      .from(companionRelationships)
      .where(
        and(
          eq(companionRelationships.viewerProfileId, viewerProfileId),
          eq(companionRelationships.companionProfileId, companionProfileId),
        ),
      )
      .limit(1);
    return rowToRelationship(row);
  },

  /**
   * Applies a bounded delta. The engine may only nudge values; magnitudes are clamped
   * here so a compromised or swapped provider cannot rewrite relationship state.
   */
  async applyTurn(
    tx: CompanionDb,
    current: CompanionRelationship,
    delta: Partial<Pick<CompanionRelationship, 'trust' | 'affection' | 'familiarity' | 'mood'>>,
  ): Promise<CompanionRelationship> {
    const step = (value: number | undefined): number => clamp(value ?? 0, -3, 3);
    const interactionCount = current.interactionCount + 1;
    const now = new Date();

    const [row] = await tx
      .update(companionRelationships)
      .set({
        trust: clamp(current.trust + step(delta.trust), 0, 100),
        affection: clamp(current.affection + step(delta.affection), 0, 100),
        familiarity: clamp(current.familiarity + step(delta.familiarity), 0, 100),
        mood: typeof delta.mood === 'string' && delta.mood.trim() ? delta.mood.trim().slice(0, 40) : current.mood,
        interactionCount,
        relationshipLevel: deriveLevel(interactionCount),
        lastInteractionAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(companionRelationships.viewerProfileId, current.viewerProfileId),
          eq(companionRelationships.companionProfileId, current.companionProfileId),
        ),
      )
      .returning();

    return rowToRelationship(row);
  },
};
