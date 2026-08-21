import { z } from 'zod';

export const replyLengthEnum = ['short', 'medium', 'long'] as const;

export const companionProfileIdParamSchema = z
  .object({ profileId: z.string().uuid() })
  .strict();

export const agentIdParamSchema = z.object({ agentId: z.string().uuid() }).strict();

export const listCompanionsQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(100).default(50) })
  .strict();

export const listMemoriesQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(100).default(25) })
  .strict();

const shortList = (max: number, itemMax: number) =>
  z.array(z.string().trim().min(1).max(itemMax)).max(max).default([]);

export const upsertPersonaSchema = z
  .object({
    personality: shortList(12, 60),
    traits: shortList(12, 60),
    preferences: shortList(12, 120),
    boundaries: shortList(12, 200),
    speakingExamples: shortList(8, 300),
    backstory: z.string().trim().max(2000).default(''),
    languageMode: z.string().trim().min(1).max(40).default('english'),
    tone: z.string().trim().min(1).max(40).default('warm'),
    replyLength: z.enum(replyLengthEnum).default('short'),
    relationshipStyle: z.string().trim().min(1).max(60).default('friendly'),
  })
  .strict();

export type UpsertPersonaInput = z.infer<typeof upsertPersonaSchema>;
export type ListCompanionsQuery = z.infer<typeof listCompanionsQuerySchema>;
