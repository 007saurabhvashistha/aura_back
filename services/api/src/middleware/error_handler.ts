import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { failure } from '../utils/api_response.js';
import { HttpError } from '../utils/http_error.js';
import { logger } from '../utils/logger.js';

/**
 * Central error handler. Must be registered last.
 * Never leaks internal error details in production.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(422).json(
      failure(
        'Validation failed',
        err.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
      ),
    );
    return;
  }

  if (err instanceof HttpError) {
    res
      .status(err.statusCode)
      .json(failure(err.message, [{ code: err.code, message: err.message }]));
    return;
  }

  logger.error('Unhandled error', { error: String(err) });
  res.status(500).json(failure('Internal server error'));
}
