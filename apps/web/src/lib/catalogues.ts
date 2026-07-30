import type {
  AiPersonality,
  CommunicationStyle,
  LanguageProficiency,
  SupportedLanguage,
} from '@aura/shared';

/** Mirrors the backend catalogues (services/api profile.constants.ts). */

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ar', label: 'Arabic' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
];

export const INTEREST_CATALOGUE: string[] = [
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
];

export const COMMUNICATION_STYLES: CommunicationStyle[] = [
  'casual',
  'formal',
  'playful',
  'direct',
  'supportive',
];

export const AI_PERSONALITIES: AiPersonality[] = [
  'warm',
  'playful',
  'calm',
  'intellectual',
  'empathetic',
];

export const LANGUAGE_PROFICIENCIES: LanguageProficiency[] = [
  'native',
  'fluent',
  'conversational',
  'learning',
];
