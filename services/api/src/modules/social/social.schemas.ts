import { z } from 'zod';

export const presenceEnum = ['online', 'away', 'offline'] as const;
export const visibilityEnum = ['public', 'followers'] as const;
export const socialConversationChannelEnum = ['chat', 'voice', 'video'] as const;

export const updateMyProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    headline: z.string().trim().max(160).optional(),
    bio: z.string().trim().max(1000).optional(),
    interests: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    presence: z.enum(presenceEnum).optional(),
    discoverable: z.boolean().optional(),
  })
  .strict();

export const listProfilesQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const profileIdParamSchema = z
  .object({
    profileId: z.string().uuid(),
  })
  .strict();

export const postIdParamSchema = z
  .object({
    postId: z.string().uuid(),
  })
  .strict();

export const storyIdParamSchema = z
  .object({
    storyId: z.string().uuid(),
  })
  .strict();

export const conversationIdParamSchema = z
  .object({
    conversationId: z.string().uuid(),
  })
  .strict();

export const createPostSchema = z
  .object({
    caption: z.string().trim().min(1).max(2200),
    mediaLabel: z.string().trim().max(120).default('Photo · 4:5'),
    visibility: z.enum(visibilityEnum).default('public'),
  })
  .strict();

export const createStorySchema = z
  .object({
    caption: z.string().trim().min(1).max(280),
    mediaLabel: z.string().trim().max(120).default('Photo · 1080x1920'),
  })
  .strict();

export const feedQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(30),
  })
  .strict();

export const createSocialConversationSchema = z
  .object({
    profileId: z.string().uuid(),
    channel: z.enum(socialConversationChannelEnum).default('chat'),
    topic: z.string().trim().min(1).max(160).default('New conversation'),
  })
  .strict();

export const sendSocialMessageSchema = z
  .object({
    text: z.string().trim().min(1).max(4000),
  })
  .strict();

export const reportReasonEnum = [
  'harassment',
  'spam',
  'impersonation',
  'nudity',
  'hate',
  'self_harm',
  'underage',
  'other',
] as const;

export const reportSubjectEnum = ['profile', 'post', 'story', 'conversation'] as const;

export const createReportSchema = z
  .object({
    reason: z.enum(reportReasonEnum),
    subjectType: z.enum(reportSubjectEnum).default('profile'),
    subjectId: z.string().uuid().optional(),
    details: z.string().trim().max(1000).optional(),
  })
  .strict();

export const notificationsQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(100).default(50) })
  .strict();

export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;
export type ListProfilesQuery = z.infer<typeof listProfilesQuerySchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type CreateSocialConversationInput = z.infer<typeof createSocialConversationSchema>;
export type SendSocialMessageInput = z.infer<typeof sendSocialMessageSchema>;
