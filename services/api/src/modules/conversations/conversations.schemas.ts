import { z } from 'zod';
import {
  CONVERSATION_ROLES,
  CONVERSATION_STATUSES,
  DEFAULT_AGENT_KEY,
} from './conversations.constants.js';

export const createConversationSchema = z
  .object({
    agentKey: z.string().trim().min(1).max(64).default(DEFAULT_AGENT_KEY),
  })
  .strict();

export const listConversationsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const conversationIdParamSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const upsertMessageSchema = z
  .object({
    role: z.enum(CONVERSATION_ROLES),
    content: z.string().trim().min(1).max(4000),
    sequence: z.number().int().nonnegative(),
  })
  .strict();

export const updateConversationStatusSchema = z
  .object({
    status: z.enum(CONVERSATION_STATUSES),
  })
  .strict();

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
