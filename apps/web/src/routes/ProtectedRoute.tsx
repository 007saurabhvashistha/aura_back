import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/**
 * Guards authenticated routes. While the session is being restored we render
 * nothing (a splash could go here); unauthenticated users go to /login.
 *
 * The server remains authoritative for eligibility/onboarding — this only
 * gates on whether a session exists.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="route-loading">Loading…</div>;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
