import { useAuth } from '../../auth/AuthContext';

/**
 * Admin auth hook - checks if user has admin role.
 * For now, checks if user exists (basic protection).
 * Later: check against admin role in backend.
 */
export function useAdminAuth() {
  const { status, user } = useAuth();
  
  const isAdmin = status === 'authenticated' && user !== null;
  
  return {
    isAdmin,
    isLoading: status === 'loading',
    user,
  };
}
