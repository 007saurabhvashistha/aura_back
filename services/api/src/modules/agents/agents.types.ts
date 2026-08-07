import type { AgentRow } from '../../db/schema.js';

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  model: string;
  status: 'active' | 'inactive' | 'training';
  accuracy: number | null;
  conversationCount: number;
  systemPromptId: string | null;
  personaPromptId: string | null;
  createdBy: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentListResponse {
  data: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function rowToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    model: row.model,
    status: row.status as 'active' | 'inactive' | 'training',
    accuracy: row.accuracy,
    conversationCount: row.conversationCount,
    systemPromptId: row.systemPromptId,
    personaPromptId: row.personaPromptId,
    createdBy: row.createdBy,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
