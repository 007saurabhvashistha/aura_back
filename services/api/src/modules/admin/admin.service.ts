import { adminSessionRepository } from './admin.repository.js';
import { HttpError } from '../../utils/http_error.js';
import { logger } from '../../utils/logger.js';
import type { AdminSession } from './admin.types.js';
import { rowToAdminSession } from './admin.types.js';

/**
 * Admin authentication service handles business logic for admin panel access.
 * Includes session tracking, login/logout, and security checks.
 */
export const adminService = {
  /**
   * Verify user is an admin and create an admin session.
   * Called after successful authentication.
   */
  async createAdminSession(
    userId: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AdminSession> {
    // Verify user has admin role
    if (userRole !== 'admin') {
      logger.warn('admin.auth.permission_denied', {
        event: 'admin.auth.permission_denied',
        userId,
        role: userRole,
      });
      throw HttpError.forbidden('Admin access required', 'admin_required');
    }

    // Create session in database
    const sessionRow = await adminSessionRepository.createSession({
      userId,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    logger.info('admin.session.created', {
      event: 'admin.session.created',
      sessionId: sessionRow.id,
      userId,
      ipAddress,
    });

    return rowToAdminSession(sessionRow);
  },

  /**
   * Verify that an admin session is still active.
   * Updates last activity time.
   */
  async verifyAdminSession(sessionId: string, userId: string): Promise<AdminSession> {
    const session = await adminSessionRepository.getActiveSession(sessionId);

    if (!session) {
      logger.warn('admin.session.not_found', {
        event: 'admin.session.not_found',
        sessionId,
        userId,
      });
      throw HttpError.forbidden('Admin session not found or expired', 'session_expired');
    }

    // Verify session belongs to the authenticated user
    if (session.userId !== userId) {
      logger.warn('admin.session.user_mismatch', {
        event: 'admin.session.user_mismatch',
        sessionId,
        expectedUserId: userId,
        actualUserId: session.userId,
      });
      throw HttpError.forbidden('Session does not belong to user', 'session_invalid');
    }

    // Update last activity
    await adminSessionRepository.updateLastActivity(sessionId);

    return rowToAdminSession(session);
  },

  /**
   * Logout an admin session.
   */
  async logoutAdminSession(sessionId: string, userId: string): Promise<void> {
    const session = await adminSessionRepository.getActiveSession(sessionId);

    if (!session) {
      // Session already logged out or doesn't exist - this is fine
      logger.debug('admin.session.logout.already_closed', {
        event: 'admin.session.logout.already_closed',
        sessionId,
      });
      return;
    }

    // Verify ownership
    if (session.userId !== userId) {
      logger.warn('admin.session.logout.unauthorized', {
        event: 'admin.session.logout.unauthorized',
        sessionId,
        expectedUserId: userId,
        actualUserId: session.userId,
      });
      throw HttpError.forbidden('Cannot logout session belonging to another user', 'unauthorized');
    }

    await adminSessionRepository.logoutSession(sessionId);

    logger.info('admin.session.closed', {
      event: 'admin.session.closed',
      sessionId,
      userId,
    });
  },

  /**
   * Get all active admin sessions for a user.
   */
  async getActiveSessionsForUser(userId: string): Promise<AdminSession[]> {
    const sessions = await adminSessionRepository.getActiveSessionsByUserId(userId);
    return sessions.map(rowToAdminSession);
  },

  /**
   * Logout all sessions for a user (e.g., password change scenario).
   */
  async logoutAllSessions(userId: string): Promise<number> {
    const count = await adminSessionRepository.logoutAllSessions(userId);

    logger.info('admin.session.logout_all', {
      event: 'admin.session.logout_all',
      userId,
      count,
    });

    return count;
  },
};
