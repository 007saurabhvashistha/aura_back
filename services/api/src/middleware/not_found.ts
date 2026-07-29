import type { Request, Response } from 'express';
import { failure } from '../utils/api_response.js';

/** 404 handler for unmatched routes. */
export function notFound(req: Request, res: Response): void {
  res
    .status(404)
    .json(failure(`Route not found: ${req.method} ${req.originalUrl}`));
}
