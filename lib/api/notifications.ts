import { apiClient } from '@/lib/api/client';
import type { AppNotification, UnreadCount } from '@/lib/notifications/types';

/**
 * In-app notifications (PRD §Notifications). All require a bearer token and are
 * scoped server-side to the signed-in user.
 */

export async function getNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<AppNotification[]>('/api/v1/notifications');
  return data;
}

export async function getUnreadCount(): Promise<UnreadCount> {
  const { data } = await apiClient.get<UnreadCount>(
    '/api/v1/notifications/unread-count',
  );
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/api/v1/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/api/v1/notifications/read-all');
}
