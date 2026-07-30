/**
 * Controlled catalogues and product constants for the profile domain.
 * Values are intentionally bounded so free-form input can never reach the DB.
 * Extend these lists as the product grows.
 */

/** Supported languages (ISO-639-1). */
export const SUPPORTED_LANGUAGES = ['en', 'hi', 'ar', 'es', 'fr', 'de', 'pt'] as const;

/** Controlled interest catalogue (slugs). No user-created interests in Sprint 2. */
export const INTEREST_CATALOGUE = [
  'music',
  'gaming',
  'travel',
  'movies',
  'sports',
  'technology',
  'business',
  'fitness',
  'food',
  'books',
  'anime',
  'fashion',
  'coding',
  'art',
  'photography',
] as const;

/** Communication style preference. */
export const COMMUNICATION_STYLES = [
  'casual',
  'formal',
  'playful',
  'direct',
  'supportive',
] as const;

/** AI personality preference (bounded; not coupled to any agent config). */
export const AI_PERSONALITIES = [
  'warm',
  'playful',
  'calm',
  'intellectual',
  'empathetic',
] as const;

/** Language proficiency levels. */
export const LANGUAGE_PROFICIENCIES = [
  'native',
  'fluent',
  'conversational',
  'learning',
] as const;

/** Minimum eligible age. Aura is an 18+ product for Sprint 2. */
export const MINIMUM_AGE = 18;

/** Maximum number of languages/interests a user may set. */
export const MAX_LANGUAGES = 20;
export const MAX_INTERESTS = 50;

/** Avatar upload constraints. */
export const ALLOWED_AVATAR_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
