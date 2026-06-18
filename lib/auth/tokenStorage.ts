import * as SecureStore from 'expo-secure-store';

/**
 * Secure token storage. Access/refresh tokens are sensitive and must live in
 * the device keychain/keystore (SecureStore), never in AsyncStorage.
 * Used by the API client (Slice 1: Auth wires these up).
 */
const ACCESS_TOKEN_KEY = 'servika.accessToken';
const REFRESH_TOKEN_KEY = 'servika.refreshToken';

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

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
