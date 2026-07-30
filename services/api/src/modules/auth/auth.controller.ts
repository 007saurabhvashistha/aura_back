import type { Request, Response } from 'express';
import { success } from '../../utils/api_response.js';
import { HttpError } from '../../utils/http_error.js';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from '../../utils/cookies.js';
import { authService } from './auth.service.js';
import { loginSchema, signupSchema } from './auth.schemas.js';

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const input = signupSchema.parse(req.body);
    const outcome = await authService.signup(input);
    setRefreshCookie(res, outcome.refreshToken);
    res.status(201).json(success(outcome.response, 'Account created'));
  },

  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const outcome = await authService.login(input);
    setRefreshCookie(res, outcome.refreshToken);
    res.status(200).json(success(outcome.response, 'Logged in'));
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const token = (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? undefined;
    if (!token) {
      throw HttpError.unauthorized('Missing refresh token', 'invalid_refresh');
    }
    const outcome = await authService.refresh(token);
    setRefreshCookie(res, outcome.refreshToken);
    res.status(200).json(success(outcome.tokens, 'Token refreshed'));
  },

  async logout(req: Request, res: Response): Promise<void> {
    const token = (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? undefined;
    if (token) {
      await authService.logout(token);
    }
    clearRefreshCookie(res);
    res.status(200).json(success(null, 'Logged out'));
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw HttpError.unauthorized();
    }
    const profile = await authService.getProfile(req.user.id);
    res.status(200).json(success(profile, 'OK'));
  },
};
