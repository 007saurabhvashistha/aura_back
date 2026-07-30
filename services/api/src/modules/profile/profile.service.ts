import type {
  AgeVerificationResult,
  AiPersonality,
  AvatarUploadTarget,
  CommunicationStyle,
  FullProfile,
  LanguageProficiency,
  OnboardingState,
  ProfileDetails,
  SupportedLanguage,
  UserLanguage,
  UserPreferences,
  UserProfile,
} from '@aura/shared';
import { HttpError } from '../../utils/http_error.js';
import { logger } from '../../utils/logger.js';
import { authRepository } from '../auth/auth.repository.js';
import type {
  UserInterestRow,
  UserLanguageRow,
  UserProfileRow,
  UserRow,
} from '../../db/schema.js';
import {
  extensionForContentType,
  storageService,
} from '../storage/storage.service.js';
import { MINIMUM_AGE } from './profile.constants.js';
import { profileRepository } from './profile.repository.js';
import type {
  AvatarCommitInput,
  AvatarUploadUrlInput,
  SetInterestsInput,
  SetLanguagesInput,
  UpdateProfileInput,
} from './profile.schemas.js';

/** Map a user row to the public identity view (never includes the hash). */
function toUserProfile(user: UserRow): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/** Map a profile row to the public profile details (DOB never present). */
function toProfileDetails(row: UserProfileRow): ProfileDetails {
  return {
    displayName: row.displayName,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    primaryLanguage: (row.primaryLanguage as SupportedLanguage | null) ?? null,
    communicationStyle: (row.communicationStyle as CommunicationStyle | null) ?? null,
    aiPersonality: (row.aiPersonality as AiPersonality | null) ?? null,
    isAgeVerified: row.isAgeVerified,
    preferences: (row.preferences as UserPreferences) ?? {},
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toUserLanguage(row: UserLanguageRow): UserLanguage {
  return {
    languageCode: row.languageCode as SupportedLanguage,
    proficiency: (row.proficiency as LanguageProficiency | null) ?? 'conversational',
  };
}

/** The server is authoritative for onboarding completeness. */
function computeOnboarding(profile: UserProfileRow): OnboardingState {
  const missing: string[] = [];
  if (!profile.displayName) missing.push('displayName');
  if (!profile.isAgeVerified) missing.push('ageVerification');
  if (!profile.primaryLanguage) missing.push('primaryLanguage');
  return { complete: missing.length === 0, missingRequired: missing };
}

/** Whole-years age from a UTC date of birth. */
function calculateAge(dob: Date): number {
  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

async function loadContext(
  userId: string,
): Promise<{ user: UserRow; profile: UserProfileRow }> {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw HttpError.notFound('User not found', 'user_not_found');
  }
  const profile = await profileRepository.ensureProfile(userId);
  return { user, profile };
}

export const profileService = {
  async getFullProfile(userId: string): Promise<FullProfile> {
    const { user, profile } = await loadContext(userId);
    const [languages, interests] = await Promise.all([
      profileRepository.findLanguages(userId),
      profileRepository.findInterests(userId),
    ]);
    return {
      user: toUserProfile(user),
      profile: toProfileDetails(profile),
      languages: languages.map(toUserLanguage),
      interests: interests.map((i: UserInterestRow) => i.interest),
      onboarding: computeOnboarding(profile),
    };
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<FullProfile> {
    await loadContext(userId);
    await profileRepository.updateProfile(userId, input);
    logger.info('profile.updated', {
      event: 'profile.updated',
      userId,
      fields: Object.keys(input),
    });
    return this.getFullProfile(userId);
  },

  /**
   * Server-authoritative age verification. DOB is used transiently to compute
   * age and is never persisted, returned, or logged.
   */
  async verifyAge(userId: string, dateOfBirth: string): Promise<AgeVerificationResult> {
    await loadContext(userId);
    const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);
    const age = calculateAge(dob);

    if (age < MINIMUM_AGE) {
      logger.warn('profile.age.rejected', {
        event: 'profile.age.rejected',
        userId,
        reason: 'under_minimum_age',
      });
      throw new HttpError(403, `You must be at least ${MINIMUM_AGE}`, 'age_not_eligible');
    }

    const verifiedAt = new Date();
    await profileRepository.setAgeVerified(userId, verifiedAt);
    logger.info('profile.age.verified', { event: 'profile.age.verified', userId });
    return { isAgeVerified: true, ageVerifiedAt: verifiedAt.toISOString() };
  },

  async getLanguages(userId: string): Promise<UserLanguage[]> {
    await loadContext(userId);
    const rows = await profileRepository.findLanguages(userId);
    return rows.map(toUserLanguage);
  },

  async setLanguages(userId: string, input: SetLanguagesInput): Promise<UserLanguage[]> {
    await loadContext(userId);
    const rows = await profileRepository.replaceLanguages(userId, input.languages);
    logger.info('profile.languages.set', {
      event: 'profile.languages.set',
      userId,
      count: rows.length,
    });
    return rows.map(toUserLanguage);
  },

  async getInterests(userId: string): Promise<string[]> {
    await loadContext(userId);
    const rows = await profileRepository.findInterests(userId);
    return rows.map((r) => r.interest);
  },

  async setInterests(userId: string, input: SetInterestsInput): Promise<string[]> {
    await loadContext(userId);
    const rows = await profileRepository.replaceInterests(userId, input.interests);
    logger.info('profile.interests.set', {
      event: 'profile.interests.set',
      userId,
      count: rows.length,
    });
    return rows.map((r) => r.interest);
  },

  async createAvatarUploadTarget(
    userId: string,
    input: AvatarUploadUrlInput,
  ): Promise<AvatarUploadTarget> {
    await loadContext(userId);
    const extension = extensionForContentType(input.contentType);
    if (!extension) {
      throw HttpError.badRequest('Unsupported content type', 'unsupported_content_type');
    }
    const objectKey = storageService.buildAvatarKey(userId, extension);
    const target = await storageService.createUploadTarget(objectKey, input.contentType);
    logger.info('profile.avatar.upload_url', {
      event: 'profile.avatar.upload_url',
      userId,
    });
    return target;
  },

  async commitAvatar(userId: string, input: AvatarCommitInput): Promise<ProfileDetails> {
    await loadContext(userId);
    // Ownership: the key must live under this user's avatar prefix.
    if (!input.objectKey.startsWith(`avatars/${userId}/`)) {
      logger.warn('profile.avatar.rejected', {
        event: 'profile.avatar.rejected',
        userId,
        reason: 'ownership_mismatch',
      });
      throw HttpError.badRequest('Object key does not belong to you', 'invalid_object_key');
    }
    const exists = await storageService.head(input.objectKey);
    if (!exists) {
      throw HttpError.badRequest('Uploaded object not found', 'object_not_found');
    }
    const publicUrl = storageService.resolvePublicUrl(input.objectKey);
    const row = await profileRepository.setAvatarUrl(userId, publicUrl);
    logger.info('profile.avatar.updated', { event: 'profile.avatar.updated', userId });
    return toProfileDetails(row);
  },

  async deleteAvatar(userId: string): Promise<ProfileDetails> {
    const { profile } = await loadContext(userId);
    if (profile.avatarUrl) {
      // Best-effort object deletion; failure must not block clearing the URL.
      const key = profile.avatarUrl.split('/aura/')[1] ?? null;
      if (key) {
        await storageService.delete(key).catch(() => undefined);
      }
    }
    const row = await profileRepository.setAvatarUrl(userId, null);
    logger.info('profile.avatar.deleted', { event: 'profile.avatar.deleted', userId });
    return toProfileDetails(row);
  },
};
