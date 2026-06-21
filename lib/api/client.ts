import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { config } from '@/lib/config';
import { tokenStorage } from '@/lib/auth/tokenStorage';

/**
 * Shared axios instance for the Servika API.
 *
 * - baseURL points at the raw host; callers pass full paths like
 *   `/api/v1/auth/login` (or use the `apiUrl()` helper from config).
 * - A request interceptor attaches the bearer token when one exists.
 * - A response interceptor transparently refreshes an expired access token on a
 *   401 and retries the original request once (see below). If refresh fails, the
 *   session is cleared and the app is notified to drop back to guest.
 */
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (request) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

// ── Refresh-on-401 ──────────────────────────────────────────────────────────

/**
 * Notifier the app sets so it can drop to guest state when the session can no
 * longer be refreshed. Registered by AuthContext; null outside the app.
 */
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(cb: (() => void) | null) {
  onSessionExpired = cb;
}

// Endpoints that mint/verify credentials themselves — a 401 here is a real
// failure (e.g. wrong password), never an expired access token, so don't refresh.
const NO_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/forgot-password',
  '/auth/reset-password',
];

type TokenResponse = {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
};

// Single-flight: many requests can 401 at once, but only one refresh runs; the
// rest await the same promise. Reset once it settles so a later expiry refreshes
// again. Resolves to the new access token, or null if refresh failed.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    // Bare axios (no interceptors) so a 401 here can't recurse into this logic.
    const { data } = await axios.post<TokenResponse>(
      `${config.apiBaseUrl}/api/v1/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
    );
    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const skip = NO_REFRESH_PATHS.some((p) => url.includes(p));

    if (status === 401 && original && !original._retry && !skip) {
      original._retry = true;

      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }
      const newToken = await refreshing;

      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original); // replay the original request, once
      }

      // Couldn't refresh — the session is dead. Clear it and notify the app.
      await tokenStorage.clear();
      onSessionExpired?.();
    }

    return Promise.reject(error);
  },
);
