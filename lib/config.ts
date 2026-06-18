/**
 * Runtime configuration for the Servika mobile app.
 *
 * The API base URL is read from the EXPO_PUBLIC_API_URL env var so it can
 * differ per environment (local dev, staging, prod) without code changes.
 * See .env.example for setup. When running on a physical device, this must
 * be your machine's LAN IP (e.g. http://192.168.1.20:5046), not localhost.
 */
const DEFAULT_API_URL = 'http://localhost:5046';

export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  apiVersion: 'v1',
} as const;

export const apiUrl = (path: string) =>
  `${config.apiBaseUrl}/api/${config.apiVersion}${path.startsWith('/') ? path : `/${path}`}`;
