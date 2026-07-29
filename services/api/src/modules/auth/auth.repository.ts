import { and, eq, isNull } from 'drizzle-orm';
import { requireDb } from '../../db/client.js';
import {
  refreshTokens,
  users,
  type NewRefreshTokenRow,
  type NewUserRow,
  type RefreshTokenRow,
  type UserRow,
} from '../../db/schema.js';

/** Data-access for auth (no HTTP, no business rules). */
export const authRepository = {
  async findUserByEmail(email: string): Promise<UserRow | undefined> {
    const db = requireDb();
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return row;
  },

  async findUserById(id: string): Promise<UserRow | undefined> {
    const db = requireDb();
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  },

  async createUser(data: NewUserRow): Promise<UserRow> {
    const db = requireDb();
    const [row] = await db.insert(users).values(data).returning();
    return row;
  },

  async createRefreshToken(data: NewRefreshTokenRow): Promise<RefreshTokenRow> {
    const db = requireDb();
    const [row] = await db.insert(refreshTokens).values(data).returning();
    return row;
  },

  async findActiveRefreshToken(id: string): Promise<RefreshTokenRow | undefined> {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.id, id), isNull(refreshTokens.revokedAt)))
      .limit(1);
    return row;
  },

  async revokeRefreshToken(id: string): Promise<void> {
    const db = requireDb();
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  },
};
