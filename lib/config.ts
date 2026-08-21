/**
 * Runtime configuration for the Servika mobile app.
 *
 * The API base URL is read from the EXPO_PUBLIC_API_URL env var so it can
 * differ per environment (local dev, staging, prod) without code changes.
 * See .env.example for setup. When running on a physical device, this must
 * be your machine's LAN IP (e.g. http://192.168.1.20:5046), not localhost.
 */
const DEFAULT_API_URL = 'http://localhost:5046';

const configured = process.env.EXPO_PUBLIC_API_URL;

/**
 * EXPO_PUBLIC_* values are inlined at bundle time, so a release built without
 * this variable ships pointing at localhost — every request then fails with a
 * network error indistinguishable from the user having no signal, and the app
 * sails through review because the failure only appears on a real device.
 *
 * Failing here is deliberate and loud: the first launch of a misconfigured
 * build dies immediately, in QA, instead of quietly in customers' hands. Set
 * the variable per profile in eas.json.
 */
if (!configured && !__DEV__) {
  throw new Error(
    'EXPO_PUBLIC_API_URL was not set when this bundle was built. ' +
      'Set it in the build profile (eas.json) and rebuild — a release must ' +
      'never fall back to localhost.',
  );
}

export const config = {
  apiBaseUrl: configured ?? DEFAULT_API_URL,
  apiVersion: 'v1',
} as const;

export const apiUrl = (path: string) =>
  `${config.apiBaseUrl}/api/${config.apiVersion}${path.startsWith('/') ? path : `/${path}`}`;
