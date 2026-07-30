import { Router } from 'express';
import { asyncHandler } from '../../utils/async_handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { profileLimiter } from '../../middleware/rate_limit.js';
import { profileController } from './profile.controller.js';

export const profileRouter = Router();

// Every profile endpoint requires a valid access token.
profileRouter.use(authenticate);

// Profile.
profileRouter.get('/me', asyncHandler(profileController.getMe));
profileRouter.patch('/me', profileLimiter, asyncHandler(profileController.updateMe));

// Languages (PUT replaces the complete set).
profileRouter.get('/me/languages', asyncHandler(profileController.getLanguages));
profileRouter.put('/me/languages', profileLimiter, asyncHandler(profileController.setLanguages));

// Interests (PUT replaces the complete set).
profileRouter.get('/me/interests', asyncHandler(profileController.getInterests));
profileRouter.put('/me/interests', profileLimiter, asyncHandler(profileController.setInterests));

// Age verification (server-authoritative; DOB is transient).
profileRouter.post(
  '/me/age-verification',
  profileLimiter,
  asyncHandler(profileController.verifyAge),
);

// Avatar (server-issued object keys only).
profileRouter.post(
  '/me/avatar/upload-url',
  profileLimiter,
  asyncHandler(profileController.avatarUploadUrl),
);
profileRouter.put('/me/avatar', profileLimiter, asyncHandler(profileController.commitAvatar));
profileRouter.delete('/me/avatar', profileLimiter, asyncHandler(profileController.deleteAvatar));
