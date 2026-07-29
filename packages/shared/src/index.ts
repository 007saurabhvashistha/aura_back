/**
 * Shared, transport-agnostic API contract types used by both the Aura backend
 * (services/api) and frontend (apps/web).
 */

/** Standard API envelope. Every endpoint returns this shape. */
export interface ApiResponse<TData = unknown> {
  status: 'success' | 'error';
  message: string;
  data: TData | null;
  errors: ApiError[] | null;
  meta: ApiMeta | null;
}

export interface ApiError {
  field?: string;
  code: string;
  message: string;
}

export interface ApiMeta {
  requestId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/** Health check payload returned by GET /health. */
export interface HealthStatus {
  service: string;
  status: 'ok' | 'degraded' | 'down';
  uptimeSeconds: number;
  version: string;
  database: 'connected' | 'disconnected' | 'unknown';
}

/** Public representation of a user (never includes the password hash). */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

/** JWT pair issued on signup/login/refresh. */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
}

/** Response body for signup, login, and refresh endpoints. */
export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}
