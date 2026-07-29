import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Wrap an async route handler so rejected promises reach the error handler. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
