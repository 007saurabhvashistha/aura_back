import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { failure } from '../utils/api_response.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** Skip limiting during automated tests so integration tests stay deterministic. */
const skip = (): boolean => env.NODE_ENV === 'test';

const handler = (_req: Request, res: Response): void => {
  res
    .status(429)
    .json(failure('Too many requests, please try again later', [
      { code: 'rate_limited', message: 'Rate limit exceeded' },
    ]));
};

/** Baseline limiter for all authentication endpoints. */
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  handler,
});

/** Stricter limiter for credential-sensitive endpoints (login, signup). */
export const sensitiveAuthLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  handler,
});

/** Limiter for authenticated profile mutations (PATCH/PUT/POST/DELETE). */
export const profileLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  handler,
});
