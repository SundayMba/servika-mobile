import { useNotificationObserver } from '@/lib/push/useNotificationObserver';

/**
 * Mount point for the push deep-link observer.
 *
 * The hook reads auth status, so it has to sit inside AuthProvider — the root
 * layout component itself renders the provider and is therefore above it.
 * Renders nothing.
 */
export function NotificationObserver() {
  useNotificationObserver();
  return null;
}
