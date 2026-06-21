import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import type { AuthResponse, User } from '@/lib/auth/types';

/**
 * App-wide auth session state. Hydrates from SecureStore on boot so a returning
 * user lands straight in the app (and never sees onboarding again). The router
 * (app/index.tsx) reads `status` to decide where to send the user.
 */
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  /** Persist tokens + profile from a register/login response and sign in. */
  signIn: (auth: AuthResponse) => Promise<void>;
  /** Clear the session (tokens + cached profile) and sign out. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  // Rehydrate the session once on startup.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, storedUser] = await Promise.all([
        tokenStorage.getAccessToken(),
        tokenStorage.getUser(),
      ]);
      if (cancelled) return;
      if (token && storedUser) {
        setUser(storedUser);
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (auth: AuthResponse) => {
    await tokenStorage.setTokens(auth.accessToken, auth.refreshToken);
    await tokenStorage.setUser(auth.user);
    setUser(auth.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
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
