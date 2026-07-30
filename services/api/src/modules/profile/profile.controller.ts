import type { Request, Response } from 'express';
import { success } from '../../utils/api_response.js';
import { HttpError } from '../../utils/http_error.js';
import { profileService } from './profile.service.js';
import {
  ageVerificationSchema,
  avatarCommitSchema,
  avatarUploadUrlSchema,
  setInterestsSchema,
  setLanguagesSchema,
  updateProfileSchema,
} from './profile.schemas.js';

/** Resolve the authenticated user id or throw 401. */
function requireUserId(req: Request): string {
  if (!req.user) {
    throw HttpError.unauthorized();
  }
  return req.user.id;
}

export const profileController = {
  async getMe(req: Request, res: Response): Promise<void> {
    const profile = await profileService.getFullProfile(requireUserId(req));
    res.status(200).json(success(profile, 'OK'));
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    const input = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateProfile(requireUserId(req), input);
    res.status(200).json(success(profile, 'Profile updated'));
  },

  async verifyAge(req: Request, res: Response): Promise<void> {
    const { dateOfBirth } = ageVerificationSchema.parse(req.body);
    const result = await profileService.verifyAge(requireUserId(req), dateOfBirth);
    res.status(200).json(success(result, 'Age verified'));
  },

  async getLanguages(req: Request, res: Response): Promise<void> {
    const languages = await profileService.getLanguages(requireUserId(req));
    res.status(200).json(success({ languages }, 'OK'));
  },

  async setLanguages(req: Request, res: Response): Promise<void> {
    const input = setLanguagesSchema.parse(req.body);
    const languages = await profileService.setLanguages(requireUserId(req), input);
    res.status(200).json(success({ languages }, 'Languages updated'));
  },

  async getInterests(req: Request, res: Response): Promise<void> {
    const interests = await profileService.getInterests(requireUserId(req));
    res.status(200).json(success({ interests }, 'OK'));
  },

  async setInterests(req: Request, res: Response): Promise<void> {
    const input = setInterestsSchema.parse(req.body);
    const interests = await profileService.setInterests(requireUserId(req), input);
    res.status(200).json(success({ interests }, 'Interests updated'));
  },

  async avatarUploadUrl(req: Request, res: Response): Promise<void> {
    const input = avatarUploadUrlSchema.parse(req.body);
    const target = await profileService.createAvatarUploadTarget(requireUserId(req), input);
    res.status(200).json(success(target, 'OK'));
  },

  async commitAvatar(req: Request, res: Response): Promise<void> {
    const input = avatarCommitSchema.parse(req.body);
    const profile = await profileService.commitAvatar(requireUserId(req), input);
    res.status(200).json(success(profile, 'Avatar updated'));
  },

  async deleteAvatar(req: Request, res: Response): Promise<void> {
    const profile = await profileService.deleteAvatar(requireUserId(req));
    res.status(200).json(success(profile, 'Avatar removed'));
  },
};
