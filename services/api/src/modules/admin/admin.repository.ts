import { and, eq, isNull } from 'drizzle-orm';
import { adminSessions, type AdminSessionRow, type NewAdminSessionRow } from '../../db/schema.js';
import { getDb } from '../../db/client.js';

/**
 * Admin session repository handles database operations for admin panel sessions.
 * Follows the repository pattern to separate data access from business logic.
 */
export const adminSessionRepository = {
  /**
   * Create a new admin session record.
   */
  async createSession(
    data: Omit<NewAdminSessionRow, 'createdAt' | 'loggedInAt' | 'lastActivityAt'>,
  ): Promise<AdminSessionRow> {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = await db.insert(adminSessions).values(data).returning();
    return result[0]!;
  },

  /**
   * Get an active session by ID.
   * Active means loggedOutAt is null.
   */
  async getActiveSession(sessionId: string): Promise<AdminSessionRow | undefined> {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = await db
      .select()
      .from(adminSessions)
      .where(and(eq(adminSessions.id, sessionId), isNull(adminSessions.loggedOutAt)))
      .limit(1);

    return result[0];
  },

  /**
   * Get all active sessions for a user.
   */
  async getActiveSessionsByUserId(userId: string): Promise<AdminSessionRow[]> {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    return db
      .select()
      .from(adminSessions)
      .where(and(isNull(adminSessions.loggedOutAt), eq(adminSessions.userId, userId)));
  },

  /**
   * Update session's last activity time.
   */
  async updateLastActivity(sessionId: string): Promise<AdminSessionRow | undefined> {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = await db
      .update(adminSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(adminSessions.id, sessionId))
      .returning();

    return result[0];
  },

  /**
   * Logout a session by setting loggedOutAt.
   */
  async logoutSession(sessionId: string): Promise<AdminSessionRow | undefined> {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = await db
      .update(adminSessions)
      .set({ loggedOutAt: new Date() })
      .where(eq(adminSessions.id, sessionId))
      .returning();

    return result[0];
  },

  /**
   * Logout all sessions for a user.
   */
  async logoutAllSessions(userId: string): Promise<number> {
    const db = getDb();
    if (!db) throw new Error('Database not initialized');

    const result = await db
      .update(adminSessions)
      .set({ loggedOutAt: new Date() })
      .where(and(eq(adminSessions.userId, userId), isNull(adminSessions.loggedOutAt)));

    return result.rowCount ?? 0;
  },
};
