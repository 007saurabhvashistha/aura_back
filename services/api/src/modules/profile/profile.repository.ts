import { eq } from 'drizzle-orm';
import { requireDb } from '../../db/client.js';
import {
  userInterests,
  userLanguages,
  userProfiles,
  type NewUserLanguageRow,
  type UserInterestRow,
  type UserLanguageRow,
  type UserProfileRow,
} from '../../db/schema.js';

/** Fields that may be updated through PATCH /users/me. */
export interface ProfilePatch {
  displayName?: string;
  bio?: string;
  primaryLanguage?: string;
  communicationStyle?: string;
  aiPersonality?: string;
  preferences?: Record<string, unknown>;
}

/** Data-access for the profile domain (no HTTP, no business rules). */
export const profileRepository = {
  async findProfileByUserId(userId: string): Promise<UserProfileRow | undefined> {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    return row;
  },

  /** Ensure a profile row exists (safety net for users created before Sprint 2). */
  async ensureProfile(userId: string): Promise<UserProfileRow> {
    const existing = await this.findProfileByUserId(userId);
    if (existing) return existing;
    const db = requireDb();
    const [row] = await db.insert(userProfiles).values({ userId }).returning();
    return row;
  },

  /** Partial update; always bumps `updated_at`. */
  async updateProfile(userId: string, patch: ProfilePatch): Promise<UserProfileRow> {
    const db = requireDb();
    const [row] = await db
      .update(userProfiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return row;
  },

  /** Server-controlled age eligibility. DOB is never stored. */
  async setAgeVerified(userId: string, verifiedAt: Date): Promise<UserProfileRow> {
    const db = requireDb();
    const [row] = await db
      .update(userProfiles)
      .set({ isAgeVerified: true, ageVerifiedAt: verifiedAt, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return row;
  },

  async setAvatarUrl(userId: string, avatarUrl: string | null): Promise<UserProfileRow> {
    const db = requireDb();
    const [row] = await db
      .update(userProfiles)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return row;
  },

  async findLanguages(userId: string): Promise<UserLanguageRow[]> {
    const db = requireDb();
    return db.select().from(userLanguages).where(eq(userLanguages.userId, userId));
  },

  /** Replace the complete language set atomically. */
  async replaceLanguages(
    userId: string,
    languages: Array<{ languageCode: string; proficiency: string }>,
  ): Promise<UserLanguageRow[]> {
    const db = requireDb();
    return db.transaction(async (tx) => {
      await tx.delete(userLanguages).where(eq(userLanguages.userId, userId));
      if (languages.length > 0) {
        const rows: NewUserLanguageRow[] = languages.map((l) => ({
          userId,
          languageCode: l.languageCode,
          proficiency: l.proficiency,
        }));
        await tx.insert(userLanguages).values(rows);
      }
      return tx.select().from(userLanguages).where(eq(userLanguages.userId, userId));
    });
  },

  async findInterests(userId: string): Promise<UserInterestRow[]> {
    const db = requireDb();
    return db.select().from(userInterests).where(eq(userInterests.userId, userId));
  },

  /** Replace the complete interest set atomically. */
  async replaceInterests(userId: string, interests: string[]): Promise<UserInterestRow[]> {
    const db = requireDb();
    return db.transaction(async (tx) => {
      await tx.delete(userInterests).where(eq(userInterests.userId, userId));
      if (interests.length > 0) {
        await tx
          .insert(userInterests)
          .values(interests.map((interest) => ({ userId, interest })));
      }
      return tx.select().from(userInterests).where(eq(userInterests.userId, userId));
    });
  },
};
