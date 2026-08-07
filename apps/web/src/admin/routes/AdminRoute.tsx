import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { Loading } from '../components/Loading';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute - protects admin routes and requires authentication.
 * For now, checks if user is authenticated.
 * Later: add role-based access control.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, isLoading } = useAdminAuth();

  if (isLoading) {
    return <Loading message="Loading admin panel…" />;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
