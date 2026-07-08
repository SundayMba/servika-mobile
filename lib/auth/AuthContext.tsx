import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { logout as logoutRequest } from '@/lib/api/auth';
import { setOnSessionExpired } from '@/lib/api/client';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import type { AuthResponse, User } from '@/lib/auth/types';
import { registerForPush, unregisterForPush } from '@/lib/push/notifications';

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
  /** Update the cached profile after an edit (keeps the app + storage in sync). */
  updateUser: (user: User) => Promise<void>;
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

  // When the API client can't refresh an expired session, drop to guest. The
  // client has already cleared SecureStore, so we only update React state here.
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => setOnSessionExpired(null);
  }, []);

  // Register this device for push whenever we're signed in (covers login + a
  // rehydrated boot session). Best-effort; no-ops on a simulator / in Expo Go.
  useEffect(() => {
    if (status === 'authenticated') void registerForPush();
  }, [status]);

  const signIn = useCallback(async (auth: AuthResponse) => {
    await tokenStorage.setTokens(auth.accessToken, auth.refreshToken);
    await tokenStorage.setUser(auth.user);
    setUser(auth.user);
    setStatus('authenticated');
  }, []);

  const updateUser = useCallback(async (next: User) => {
    await tokenStorage.setUser(next);
    setUser(next);
  }, []);

  const signOut = useCallback(async () => {
    // Unregister this device's push token first — the endpoint needs the session.
    await unregisterForPush();
    // Best-effort: revoke the refresh token server-side. Even if the network
    // call fails, we always clear the local session so the user is logged out.
    try {
      const refresh = await tokenStorage.getRefreshToken();
      if (refresh) await logoutRequest(refresh);
    } catch {
      // ignore — local sign-out below is what matters to the user
    }
    await tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, updateUser, signOut }),
    [status, user, signIn, updateUser, signOut],
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
