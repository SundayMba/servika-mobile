import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { tokenStorage } from '@/lib/auth/tokenStorage';

/**
 * Opens the relevant screen when a push notification is tapped — both when the app
 * is already running and on a cold start launched from a notification. Notification
 * `data` carries `conversationId` (chat) or `bookingId` (booking/payment), set by the
 * backend push dispatcher. Chat opens the thread; otherwise artisans are sent to their
 * Pro job screen and customers to the booking. (Runs above the auth context, so the
 * role comes from the cached session in secure storage.)
 */
export function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

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

      const user = await tokenStorage.getUser();
      if (!mounted) return;
      if (user?.role === 'Artisan') {
        router.push({ pathname: '/pro/job/[id]', params: { id: bookingId } });
      } else {
        router.push({ pathname: '/booking/[id]', params: { id: bookingId } });
      }
    };

    // Cold start: app launched by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (mounted) open(r);
    });

    // Tapped while the app is running/backgrounded.
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [router]);
}
