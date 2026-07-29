import type { Request, Response } from 'express';
import { success } from '../../utils/api_response.js';
import { HttpError } from '../../utils/http_error.js';
import { authService } from './auth.service.js';
import { loginSchema, refreshSchema, signupSchema } from './auth.schemas.js';

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const input = signupSchema.parse(req.body);
    const result = await authService.signup(input);
    res.status(201).json(success(result, 'Account created'));
  },

  async login(req: Request, res: Response): Promise<void> {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.status(200).json(success(result, 'Logged in'));
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokens = await authService.refresh(refreshToken);
    res.status(200).json(success(tokens, 'Token refreshed'));
  },

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = refreshSchema.parse(req.body);
    await authService.logout(refreshToken);
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
