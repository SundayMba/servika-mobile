import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { tokenStorage } from '@/lib/auth/tokenStorage';

/**
 * Opens the relevant booking when a push notification is tapped — both when the app
 * is already running and on a cold start launched from a notification. Notification
 * `data` carries `bookingId` (set by the backend push dispatcher). Artisans are sent
 * to their Pro job screen; customers to the booking. (Runs above the auth context,
 * so the role comes from the cached session in secure storage.)
 */
export function useNotificationObserver() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const open = async (response?: Notifications.NotificationResponse | null) => {
      const bookingId = response?.notification.request.content.data?.bookingId;
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
