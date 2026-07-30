import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { FullProfile, UserProfile } from '@aura/shared';
import { refreshAccessToken } from '../lib/api';
import { authApi, profileApi } from '../lib/profileApi';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: UserProfile | null;
  profile: FullProfile | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch the full profile (after onboarding/profile edits). */
  refreshProfile: () => Promise<FullProfile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<FullProfile | null>(null);

  const loadProfile = useCallback(async (): Promise<FullProfile | null> => {
    try {
      const full = await profileApi.getMe();
      setProfile(full);
      setUser(full.user);
      return full;
    } catch {
      return null;
    }
  }, []);

  // On first load, try to restore a session using the httpOnly refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      const refreshed = await refreshAccessToken();
      if (!active) return;
      if (refreshed) {
        const full = await loadProfile();
        if (!active) return;
        setStatus(full ? 'authenticated' : 'unauthenticated');
      } else {
        setStatus('unauthenticated');
      }
    })();
    return () => {
      active = false;
    };
  }, [loadProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      setUser(res.user);
      await loadProfile();
      setStatus('authenticated');
    },
    [loadProfile],
  );

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await authApi.signup(email, password, name);
      setUser(res.user);
      await loadProfile();
      setStatus('authenticated');
    },
    [loadProfile],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setProfile(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, profile, login, signup, logout, refreshProfile: loadProfile }),
    [status, user, profile, login, signup, logout, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
