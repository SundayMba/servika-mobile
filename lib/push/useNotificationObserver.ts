import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Opens the relevant screen when a push notification is tapped — both when the app
 * is already running and on a cold start launched from a notification. Notification
 * `data` carries `conversationId` (chat) or `bookingId` (booking/payment), set by the
 * backend push dispatcher. Chat opens the thread; anything booking-shaped opens the
 * booking detail (the artisan surface is the separate Servika Pro app).
 *
 * Nothing is opened until auth has resolved. Both targets are authenticated
 * screens, so navigating while `status` is still 'loading' pushes the customer
 * at a route that redirects them straight back out — the cold-start case, where
 * the tap that launched the app is handled before the keychain read finishes,
 * is exactly when it happens. The launching response stays available from
 * `getLastNotificationResponseAsync`, so re-reading it once the session is
 * known replays the tap rather than dropping it.
 *
 * Must be mounted INSIDE AuthProvider — see components/NotificationObserver.
 */
export function useNotificationObserver() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    let mounted = true;
    if (status === 'loading') return;

    const open = async (response?: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data;

      // Chat push → open the conversation thread (either role).
      const conversationId = data?.conversationId;
      if (typeof conversationId === 'string' && conversationId.length > 0) {
        if (!mounted) return;
        router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
        return;
      }

      const bookingId = data?.bookingId;
      if (typeof bookingId !== 'string' || bookingId.length === 0) return;
      if (!mounted) return;
      router.push({ pathname: '/booking/[id]', params: { id: bookingId } });
    };

    // Cold start: app launched by tapping a notification. Also the replay path
    // for a tap that landed while auth was still resolving — the response is
    // still the "last" one, so reading it again here picks it up.
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (mounted) void open(r);
    });

    // Tapped while the app is running/backgrounded.
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [router, status]);
}
