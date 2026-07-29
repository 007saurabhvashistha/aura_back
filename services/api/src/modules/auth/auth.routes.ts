import { Router } from 'express';
import { asyncHandler } from '../../utils/async_handler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter, sensitiveAuthLimiter } from '../../middleware/rate_limit.js';
import { authController } from './auth.controller.js';

export const authRouter = Router();

// Baseline limit across all auth endpoints; credential endpoints are stricter.
authRouter.use(authLimiter);

authRouter.post('/signup', sensitiveAuthLimiter, asyncHandler(authController.signup));
authRouter.post('/login', sensitiveAuthLimiter, asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', authenticate, asyncHandler(authController.me));
