import { and, asc, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { requireDb } from '../../db/client.js';
import {
  conversationMessages,
  conversations,
  type ConversationMessageRow,
  type ConversationRow,
  type NewConversationMessageRow,
  type NewConversationRow,
} from '../../db/schema.js';

export const conversationsRepository = {
  async createConversation(input: NewConversationRow): Promise<ConversationRow> {
    const db = requireDb();
    const [row] = await db.insert(conversations).values(input).returning();
    return row;
  },

  async listConversationsByUser(userId: string, limit: number): Promise<ConversationRow[]> {
    const db = requireDb();
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);
  },

  async findConversationById(id: string): Promise<ConversationRow | undefined> {
    const db = requireDb();
    const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return row;
  },

  async findConversationForUser(userId: string, id: string): Promise<ConversationRow | undefined> {
    const db = requireDb();
    const [row] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.userId, userId), eq(conversations.id, id)))
      .limit(1);
    return row;
  },

  async updateConversationStatus(
    id: string,
    status: ConversationRow['status'],
    patch?: Partial<Pick<ConversationRow, 'startedAt' | 'endedAt'>>,
  ): Promise<ConversationRow> {
    const db = requireDb();
    const [row] = await db
      .update(conversations)
      .set({ status, updatedAt: new Date(), ...patch })
      .where(eq(conversations.id, id))
      .returning();
    return row;
  },

  async countLiveUserConversations(userId: string): Promise<number> {
    const db = requireDb();
    const [row] = await db
      .select({ value: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.userId, userId),
          isNull(conversations.endedAt),
          sql`${conversations.status} in ('created', 'connecting', 'active', 'ending')`,
        ),
      );
    return Number(row?.value ?? 0);
  },

  async addMessage(input: NewConversationMessageRow): Promise<ConversationMessageRow> {
    const db = requireDb();
    const [row] = await db.insert(conversationMessages).values(input).returning();
    return row;
  },

  async listMessages(conversationId: string): Promise<ConversationMessageRow[]> {
    const db = requireDb();
    return db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(asc(conversationMessages.sequence), asc(conversationMessages.createdAt));
  },
};
