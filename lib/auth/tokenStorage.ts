import * as SecureStore from 'expo-secure-store';
import type { User } from '@/lib/auth/types';

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

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
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
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
