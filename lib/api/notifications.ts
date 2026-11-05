import { apiClient } from '@/lib/api/client';
import type { AppNotification, UnreadCount } from '@/lib/notifications/types';

/**
 * In-app notifications (PRD §Notifications). All require a bearer token and are
 * scoped server-side to the signed-in user. `audience: 'customer'` keeps the feed,
 * badge and read-all to this app's notices, since one account can be signed into
 * both the customer app and Servika Pro.
 */

const AUDIENCE = { audience: 'customer' } as const;

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<AppNotification[]>('/api/v1/notifications', {
    params: AUDIENCE,
  });
  return data;
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const { data } = await apiClient.get<UnreadCount>(
    '/api/v1/notifications/unread-count',
    { params: AUDIENCE },
  );
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/api/v1/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/api/v1/notifications/read-all', null, { params: AUDIENCE });
}
