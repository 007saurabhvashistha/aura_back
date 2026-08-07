import type { AdminSessionRow } from '../../db/schema.js';

/**
 * Admin session response object for API.
 * Excludes sensitive fields and formats dates as ISO strings.
 */
export interface AdminSession {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  loggedInAt: string;
  lastActivityAt: string;
  loggedOutAt: string | null;
  isActive: boolean;
}

/**
 * Convert database row to API response object.
 */
export function rowToAdminSession(row: AdminSessionRow): AdminSession {
  return {
    id: row.id,
    userId: row.userId,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    loggedInAt: row.loggedInAt.toISOString(),
    lastActivityAt: row.lastActivityAt.toISOString(),
    loggedOutAt: row.loggedOutAt?.toISOString() ?? null,
    isActive: row.loggedOutAt === null,
  };
}

/**
 * Admin login response.
 */
export interface AdminLoginResponse {
  session: AdminSession;
  message: string;
}

/**
 * Admin logout response.
 */
export interface AdminLogoutResponse {
  message: string;
}

/**
 * Active sessions list response.
 */
export interface ActiveSessionsListResponse {
  sessions: AdminSession[];
  total: number;
}
