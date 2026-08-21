import * as SecureStore from 'expo-secure-store';
import type { User } from '@/lib/auth/types';
import { reportError } from '@/lib/observability/report';

/**
 * Secure token storage. Access/refresh tokens are sensitive and must live in
 * the device keychain/keystore (SecureStore), never in AsyncStorage.
 * Used by the API client and the AuthProvider (Slice 1: Auth).
 *
 * The signed-in user profile is cached alongside the tokens so the app can
 * render the authenticated state on boot without a network round-trip.
 */
const ACCESS_TOKEN_KEY = 'servika.accessToken';
const REFRESH_TOKEN_KEY = 'servika.refreshToken';
const USER_KEY = 'servika.user';

/**
 * Android's SecureStore backend rejects values over roughly 2048 bytes, and
 * `setItemAsync` throws when one crosses it. Unhandled, that surfaces as the
 * worst possible bug: sign-in appears to succeed, then the session is gone on
 * next launch with nothing to explain it — and only for the accounts with the
 * most claims and the longest names, so it never shows up in testing.
 *
 * `write` makes the breach explicit rather than letting it escape as an opaque
 * failure from deep inside signIn. A token too large to store is a server-side
 * problem (trim the JWT claims); this is the tripwire that says so.
 */
const MAX_SECURE_BYTES = 2048;

/** UTF-8 byte length. Counted by hand rather than with TextEncoder, which is
 *  not a reliable global across Hermes versions. */
function utf8Length(value: string): number {
  let bytes = 0;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.codePointAt(i) as number;
    if (code > 0xffff) i += 1; // surrogate pair, counted once
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

async function write(key: string, value: string): Promise<void> {
  const bytes = utf8Length(value);
  if (bytes > MAX_SECURE_BYTES) {
    reportError(
      new Error(`SecureStore value for ${key} is ${bytes} bytes, over the ~${MAX_SECURE_BYTES}-byte Android limit`),
      { key, bytes },
    );
    throw new Error(
      'Could not store your session securely on this device. Please contact support.',
    );
  }
  await SecureStore.setItemAsync(key, value);
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await write(ACCESS_TOKEN_KEY, accessToken);
    await write(REFRESH_TOKEN_KEY, refreshToken);
  },

  async getUser(): Promise<User | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    // Only the fields the app renders before its first network call. Caching
    // the whole object is what pushes this key toward the size ceiling.
    const cached: User = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      phoneVerified: user.phoneVerified,
    };
    await write(USER_KEY, JSON.stringify(cached));
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
