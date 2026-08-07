import { getDb } from '../../db/client.js';
import { agents } from '../../db/schema.js';
import { eq, like, and, isNull, count, sql } from 'drizzle-orm';
import { HttpError } from '../../utils/http_error.js';
import type { CreateAgentInput, UpdateAgentInput, ListAgentsQuery } from './agents.schemas.js';
import { rowToAgent, type Agent } from './agents.types.js';

function getDatabase() {
  const db = getDb();
  if (!db) {
    throw HttpError.unauthorized('Database not available');
  }
  return db;
}

export const agentsService = {
  /**
   * List all agents with optional filtering and pagination.
   */
  async list(query: ListAgentsQuery): Promise<{
    data: Agent[];
    total: number;
  }> {
    const { page, limit, status, search } = query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [isNull(agents.deletedAt)];

    if (status !== 'all') {
      conditions.push(eq(agents.status, status));
    }

    if (search) {
      conditions.push(like(agents.name, `%${search}%`));
    }

    // Fetch data and count
    const db = getDatabase();
    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(agents)
        .where(and(...conditions))
        .orderBy(agents.createdAt)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(agents)
        .where(and(...conditions)),
    ]);

    const total = totalResult[0]?.count ?? 0;
    return {
      data: rows.map(rowToAgent),
      total,
    };
  },

  /**
   * Get a single agent by ID.
   */
  async getById(id: string): Promise<Agent> {
    const db = getDatabase();
    const row = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), isNull(agents.deletedAt)))
      .limit(1);

    if (!row.length) {
      throw HttpError.notFound('Agent not found');
    }

    return rowToAgent(row[0]);
  },

  /**
   * Create a new agent.
   */
  async create(input: CreateAgentInput, createdBy: string): Promise<Agent> {
    const db = getDatabase();
    // Check for duplicate name
    const existing = await db
      .select()
      .from(agents)
      .where(and(eq(agents.name, input.name), isNull(agents.deletedAt)))
      .limit(1);

    if (existing.length) {
      throw HttpError.badRequest('Agent with this name already exists');
    }

    const [row] = await db
      .insert(agents)
      .values({
        name: input.name,
        description: input.description || null,
        model: input.model,
        status: input.status || 'inactive',
        accuracy: null,
        conversationCount: 0,
        systemPromptId: input.systemPromptId || null,
        personaPromptId: input.personaPromptId || null,
        createdBy,
        metadata: input.metadata || {},
      })
      .returning();

    return rowToAgent(row);
  },

  /**
   * Update an agent.
   */
  async update(id: string, input: UpdateAgentInput): Promise<Agent> {
    const db = getDatabase();
    // Verify agent exists
    await this.getById(id);

    // Check for duplicate name if name is being updated
    if (input.name) {
      const existing = await db
        .select()
        .from(agents)
        .where(and(eq(agents.name, input.name), isNull(agents.deletedAt)))
        .limit(1);

      if (existing.length && existing[0].id !== id) {
        throw HttpError.badRequest('Agent with this name already exists');
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.model !== undefined) updateData.model = input.model;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.systemPromptId !== undefined) updateData.systemPromptId = input.systemPromptId;
    if (input.personaPromptId !== undefined) updateData.personaPromptId = input.personaPromptId;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const [row] = await db
      .update(agents)
      .set(updateData)
      .where(eq(agents.id, id))
      .returning();

    return rowToAgent(row);
  },

  /**
   * Soft delete an agent.
   */
  async delete(id: string): Promise<void> {
    const db = getDatabase();
    // Verify agent exists
    await this.getById(id);

    await db.update(agents).set({ deletedAt: new Date() }).where(eq(agents.id, id));
  },

  /**
   * Increment conversation count for an agent.
   * Used by conversation service after a new conversation starts.
   */
  async incrementConversationCount(agentId: string): Promise<void> {
    const db = getDatabase();
    await db
      .update(agents)
      .set({
        conversationCount: sql`${agents.conversationCount} + 1`,
      })
      .where(eq(agents.id, agentId));
  },
};
