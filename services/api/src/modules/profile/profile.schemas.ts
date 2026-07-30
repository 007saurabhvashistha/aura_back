import { z } from 'zod';
import {
  AI_PERSONALITIES,
  ALLOWED_AVATAR_CONTENT_TYPES,
  COMMUNICATION_STYLES,
  INTEREST_CATALOGUE,
  LANGUAGE_PROFICIENCIES,
  MAX_AVATAR_SIZE_BYTES,
  MAX_INTERESTS,
  MAX_LANGUAGES,
  SUPPORTED_LANGUAGES,
} from './profile.constants.js';

/** Strictly-validated, evolving preferences persisted as JSONB. */
export const preferencesSchema = z
  .object({
    conversationStyle: z.enum(['casual', 'balanced', 'deep']).optional(),
    responseLength: z.enum(['short', 'medium', 'long']).optional(),
    humor: z.boolean().optional(),
    deepConversations: z.boolean().optional(),
  })
  .strict();

/**
 * PATCH /users/me body. `.strict()` rejects any unknown key — including
 * `dateOfBirth`, `isAgeVerified`, and `ageVerifiedAt`, which are never
 * client-controlled. At least one field must be present.
 */
export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    bio: z.string().trim().max(500).optional(),
    primaryLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),
    communicationStyle: z.enum(COMMUNICATION_STYLES).optional(),
    aiPersonality: z.enum(AI_PERSONALITIES).optional(),
    preferences: preferencesSchema.optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * Age verification body. DOB is validated then processed transiently — it is
 * never persisted, returned, or logged.
 */
export const ageVerificationSchema = z
  .object({
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected format YYYY-MM-DD')
      .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.getTime());
      }, 'Invalid date')
      .refine((value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return date.getTime() <= Date.now();
      }, 'Date of birth cannot be in the future')
      .refine((value) => {
        // Reject implausible dates (older than 120 years).
        const date = new Date(`${value}T00:00:00.000Z`);
        const maxAge = new Date();
        maxAge.setUTCFullYear(maxAge.getUTCFullYear() - 120);
        return date.getTime() >= maxAge.getTime();
      }, 'Invalid date of birth'),
  })
  .strict();

export const setLanguagesSchema = z
  .object({
    languages: z
      .array(
        z
          .object({
            languageCode: z.enum(SUPPORTED_LANGUAGES),
            proficiency: z.enum(LANGUAGE_PROFICIENCIES).default('conversational'),
          })
          .strict(),
      )
      .max(MAX_LANGUAGES)
      .refine(
        (langs) => new Set(langs.map((l) => l.languageCode)).size === langs.length,
        { message: 'Duplicate language codes are not allowed' },
      ),
  })
  .strict();

export const setInterestsSchema = z
  .object({
    interests: z
      .array(z.enum(INTEREST_CATALOGUE))
      .max(MAX_INTERESTS)
      .refine((items) => new Set(items).size === items.length, {
        message: 'Duplicate interests are not allowed',
      }),
  })
  .strict();

export const avatarUploadUrlSchema = z
  .object({
    contentType: z.enum(ALLOWED_AVATAR_CONTENT_TYPES),
    sizeBytes: z.number().int().positive().max(MAX_AVATAR_SIZE_BYTES),
  })
  .strict();

/**
 * Avatar commit only accepts a server-issued object key of the exact form
 * `avatars/{uuid}/{uuid}.{ext}`. Ownership (userId prefix) is re-validated in
 * the service against the authenticated user.
 */
export const avatarCommitSchema = z
  .object({
    objectKey: z
      .string()
      .regex(
        /^avatars\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp)$/,
        'Invalid object key',
      ),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AgeVerificationInput = z.infer<typeof ageVerificationSchema>;
export type SetLanguagesInput = z.infer<typeof setLanguagesSchema>;
export type SetInterestsInput = z.infer<typeof setInterestsSchema>;
export type AvatarUploadUrlInput = z.infer<typeof avatarUploadUrlSchema>;
export type AvatarCommitInput = z.infer<typeof avatarCommitSchema>;
