import * as Updates from 'expo-updates';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { reportError } from '@/lib/observability/report';

/**
 * Two kinds of update, handled differently:
 *
 * 1. JS/asset updates (EAS Update). Downloaded silently; expo-updates also
 *    checks on every cold start (`checkAutomatically: ON_LOAD`). Once one is on
 *    the phone the app offers "Restart now"; "Later" is fine because the update
 *    applies by itself on the next cold start anyway.
 * 2. Store updates (a new native build on Google Play). Google Play's in-app
 *    update flow asks the person once a day, downloads in the background and
 *    installs. We never block the app for it.
 */

const OTA_RECHECK_MS = 15 * 60 * 1000;
const STORE_PROMPT_KEY = 'store-update-prompted-at';
const STORE_PROMPT_EVERY_MS = 24 * 60 * 60 * 1000;

// A store install carries the JavaScript that was current at build time. If a newer
// update is already published, a fresh install should simply start on it instead of
// asking a person who has used the app for five seconds to "restart". Within this
// window after launch, while still running the embedded bundle, a fetched update is
// applied immediately.
const FRESH_LAUNCH_APPLY_MS = 20 * 1000;

export function useOtaUpdates() {
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);
  const lastCheck = useRef(0);
  const launchedAt = useRef(Date.now());
  const applyNow = useCallback(() => {
    Updates.reloadAsync().catch((error) => reportError(error, { where: 'ota-reload' }));
  }, []);
  const freshEmbeddedLaunch = () =>
    Updates.isEmbeddedLaunch && Date.now() - launchedAt.current < FRESH_LAUNCH_APPLY_MS;

  const check = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    const now = Date.now();
    if (now - lastCheck.current < OTA_RECHECK_MS) return;
    lastCheck.current = now;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        const fetched = await Updates.fetchUpdateAsync();
        if (fetched.isNew && freshEmbeddedLaunch()) applyNow();
      }
    } catch (error) {
      // No network, a captive portal, or the update server unreachable: the next
      // foreground retries. Only something other than a failed fetch is worth a report.
      const message = error instanceof Error ? `${error.message} ${(error as { cause?: { message?: string } }).cause?.message ?? ''}` : String(error);
      if (/failed to (?:check for|download|fetch) (?:the )?update|network|timed? ?out|unreachable|ERR_UPDATES_(?:CHECK|FETCH)/i.test(message)) return;
      reportError(error, { where: 'ota-check' });
    }
  }, [applyNow]);

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => sub.remove();
  }, [check]);

  // expo-updates may have downloaded the update itself before JS started (ON_LOAD).
  useEffect(() => {
    if (isUpdatePending && freshEmbeddedLaunch()) applyNow();
  }, [isUpdatePending, applyNow]);

  const restart = applyNow;
  const later = useCallback(() => setDismissed(true), []);

  return { ready: isUpdatePending && !dismissed, restart, later };
}

export function useStoreUpdates() {
  useEffect(() => {
    if (__DEV__ || Platform.OS !== 'android') return;
    let cancelled = false;
    (async () => {
      try {
        const last = Number((await SecureStore.getItemAsync(STORE_PROMPT_KEY)) ?? 0);
        if (Date.now() - last < STORE_PROMPT_EVERY_MS) return;
        // Lazy: binaries built before this module existed must not crash.
        /* eslint-disable-next-line @typescript-eslint/no-require-imports */
        const InApp = require('expo-in-app-updates') as typeof import('expo-in-app-updates');
        const info = await InApp.checkForUpdate();
        if (cancelled || !info.updateAvailable) return;
        const immediate = info.serverUpdateType === 'IMMEDIATE' && !!info.immediateAllowed;
        if (!immediate && !info.flexibleAllowed) return;
        await SecureStore.setItemAsync(STORE_PROMPT_KEY, String(Date.now()));
        await InApp.startUpdate(immediate);
      } catch (error) {
        // No Play Store to talk to (emulators, Play's pre-launch test devices, sideloaded
        // installs, phones without Google services). Expected, not a crash: stay quiet.
        if (/bind to the service|not (?:installed|available)|API_NOT_AVAILABLE|ERROR_APP_NOT_OWNED|-6\b/i.test(String((error as Error)?.message ?? error))) return;
        reportError(error, { where: 'store-update' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}
