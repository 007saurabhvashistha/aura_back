import type { Request, Response } from 'express';
import { adminService } from './admin.service.js';
import { HttpError } from '../../utils/http_error.js';
import { success } from '../../utils/api_response.js';
import type { AdminLoginResponse, AdminLogoutResponse, ActiveSessionsListResponse } from './admin.types.js';

/**
 * Admin authentication controller handles HTTP requests for admin panel.
 * All endpoints require valid JWT authentication and admin role.
 */
export const adminController = {
  /**
   * POST /api/v1/admin/login
   * Create an admin session (called after successful auth).
   * Expects req.user to be set by authenticate middleware.
   */
  async login(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw HttpError.unauthorized('Authentication required');
    }

    // Get IP address and user agent
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Create admin session
    const session = await adminService.createAdminSession(
      req.user.id,
      req.user.role,
      ipAddress,
      userAgent,
    );

    const response: AdminLoginResponse = {
      session,
      message: 'Admin session created',
    };

    res.status(200).json(success(response, 'Admin session created'));
  },

  /**
   * POST /api/v1/admin/logout
   * Logout an admin session.
   * Expects sessionId in request body.
   */
  async logout(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw HttpError.unauthorized('Authentication required');
    }

    const { sessionId } = req.body as { sessionId?: string };

    if (!sessionId) {
      throw HttpError.badRequest('Missing sessionId in request body');
    }

    await adminService.logoutAdminSession(sessionId, req.user.id);

    const response: AdminLogoutResponse = {
      message: 'Admin session closed',
    };

    res.status(200).json(success(response, 'Admin session closed'));
  },

  /**
   * GET /api/v1/admin/sessions
   * Get all active admin sessions for the authenticated user.
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw HttpError.unauthorized('Authentication required');
    }

    const sessions = await adminService.getActiveSessionsForUser(req.user.id);

    const response: ActiveSessionsListResponse = {
      sessions,
      total: sessions.length,
    };

    res.status(200).json(success(response, 'Active sessions retrieved'));
  },

  /**
   * POST /api/v1/admin/sessions/logout-all
   * Logout all sessions for the user (e.g., after password change).
   */
  async logoutAllSessions(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw HttpError.unauthorized('Authentication required');
    }

    const count = await adminService.logoutAllSessions(req.user.id);

    const response = {
      message: 'All sessions logged out',
      count,
    };

    res.status(200).json(success(response, `${count} admin session(s) logged out`));
  },

  /**
   * GET /api/v1/admin/verify
   * Verify current admin session is still valid.
   */
  async verifySession(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw HttpError.unauthorized('Authentication required');
    }

    const { sessionId } = req.query as { sessionId?: string };

    if (!sessionId) {
      throw HttpError.badRequest('Missing sessionId query parameter');
    }

    const session = await adminService.verifyAdminSession(sessionId, req.user.id);

    res.status(200).json(success({ session }, 'Session verified'));
  },
};
