import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';

/**
 * TanStack Query hooks for the in-app notification feed. The feed + unread badge
 * are per-user and change as bookings/payments progress, so they use a short
 * stale time; mutations invalidate both so the badge and list stay in sync.
 */

export function useNotifications(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Unread count for the Home bell badge. Polls periodically (and on focus/reconnect
 * by default) so new notifications surface without opening the feed.
 */
export function useUnreadCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

/** Compact relative time, e.g. "2d ago", "just now". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
