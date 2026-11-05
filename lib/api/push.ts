import { apiClient } from '@/lib/api/client';

/**
 * Register this device's Expo push token for the signed-in user. `app` tells the
 * server which app this is, so an account signed into both apps only gets
 * customer notices here.
 */
export async function registerPushToken(token: string, platform: string): Promise<void> {
  await apiClient.post('/api/v1/notifications/push-token', { token, platform, app: 'customer' });
}

/** Remove this device's push token (on logout). */
export async function removePushToken(token: string): Promise<void> {
  await apiClient.delete('/api/v1/notifications/push-token', { data: { token } });
}
