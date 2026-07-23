import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken, removePushToken } from '@/lib/api/push';

// Show a banner + play a sound when a push arrives while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// The Expo token we last registered — kept so we can remove exactly it on logout.
let currentToken: string | null = null;

/**
 * Requests permission, obtains this device's Expo push token, and registers it with
 * the backend. Best-effort and safe to call repeatedly. No-ops on a simulator (which
 * can't receive push) or if the user denies permission. Real delivery needs a dev
 * build — push tokens aren't available in Expo Go on SDK 54.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return; // simulators can't get a push token

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;

    currentToken = token;
    await registerPushToken(token, Platform.OS);
  } catch (e) {
    // Best-effort — a denied permission just means no push. But surface the
    // error in dev: on Android a missing google-services.json (FCM) makes
    // getExpoPushTokenAsync throw here, silently disabling ALL push banners.
    if (__DEV__) console.warn('[push] registration failed:', e);
  }
}

/** Removes this device's token from the backend (called on logout). */
export async function unregisterForPush(): Promise<void> {
  try {
    if (currentToken) {
      await removePushToken(currentToken);
      currentToken = null;
    }
  } catch {
    // ignore — the token will simply stop being delivered to
  }
}
