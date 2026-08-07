import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/async_handler.js';
import { adminController } from './admin.controller.js';

/**
 * Admin authentication routes.
 * All routes require authentication and admin role.
 *
 * Endpoints:
 * - POST /api/v1/admin/login         - Create admin session
 * - POST /api/v1/admin/logout        - Logout admin session
 * - GET  /api/v1/admin/sessions      - List active sessions
 * - POST /api/v1/admin/sessions/logout-all - Logout all sessions
 * - GET  /api/v1/admin/verify        - Verify session is active
 */
export const adminRouter = Router();

// All admin endpoints require authentication and admin role
adminRouter.use(authenticate);
adminRouter.use(authorize('admin'));

// Session management
adminRouter.post('/login', asyncHandler(adminController.login));
adminRouter.post('/logout', asyncHandler(adminController.logout));
adminRouter.get('/sessions', asyncHandler(adminController.getSessions));
adminRouter.post('/sessions/logout-all', asyncHandler(adminController.logoutAllSessions));
adminRouter.get('/verify', asyncHandler(adminController.verifySession));

export default adminRouter;
