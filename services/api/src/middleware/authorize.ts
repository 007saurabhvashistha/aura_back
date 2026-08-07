import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../utils/http_error.js';

/**
 * Role-based authorization middleware.
 * Verifies that the authenticated user has one of the allowed roles.
 *
 * Usage:
 * router.post('/endpoint', authenticate, authorize('admin', 'operator'), handler);
 *
 * @param allowedRoles - One or more role names that are allowed to access the endpoint
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Verify user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      throw HttpError.unauthorized('Authentication required before authorization check');
    }

    // Verify user has one of the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      throw HttpError.forbidden(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        'insufficient_permissions',
      );
    }

    next();
  };
}
