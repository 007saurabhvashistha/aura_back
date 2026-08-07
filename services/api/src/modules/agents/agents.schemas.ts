import { z } from 'zod';

export const agentStatusEnum = ['active', 'inactive', 'training'] as const;
export const agentModelEnum = ['gpt-4', 'claude-3', 'llama-2', 'gpt-3.5'] as const;

export const createAgentSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().max(1000).optional(),
    model: z.enum(agentModelEnum),
    status: z.enum(agentStatusEnum).default('inactive'),
    systemPromptId: z.string().uuid().optional(),
    personaPromptId: z.string().uuid().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const updateAgentSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(1000).optional(),
    model: z.enum(agentModelEnum).optional(),
    status: z.enum(agentStatusEnum).optional(),
    systemPromptId: z.string().uuid().optional().nullable(),
    personaPromptId: z.string().uuid().optional().nullable(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const listAgentsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.enum(['all', ...agentStatusEnum]).default('all'),
    search: z.string().trim().optional(),
  })
  .strict();

export const agentIdParamSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type ListAgentsQuery = z.infer<typeof listAgentsQuerySchema>;
