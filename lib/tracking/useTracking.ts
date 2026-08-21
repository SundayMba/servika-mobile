import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getLatestLocation, sendLocationPing } from '@/lib/api/tracking';
import { config } from '@/lib/config';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import type { LocationUpdate, TrackingState } from '@/lib/tracking/types';

const HUB_URL = `${config.apiBaseUrl}/hubs/tracking`;

/** Fallback poll cadence while the hub is down: quick, then progressively
 *  cheaper, so a long outage does not hold a 5s rate indefinitely. */
const BACKOFF_MS = [5_000, 5_000, 10_000, 10_000, 20_000, 30_000] as const;
/** How often to re-check whether the socket is still healthy. No request is
 *  made on these ticks — it only reads the connection's own state. */
const IDLE_CHECK_MS = 5_000;

/** Builds a hub connection that authenticates with the stored access token
 *  (passed as the access_token query param — WebSockets can't set headers). */
function buildConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: async () => (await tokenStorage.getAccessToken()) ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Critical) // transient WS drops auto-reconnect; don't spam console.error / dev LogBox
    .build();
}

/**
 * Customer-side live tracking. Connects to the hub, joins the booking's group,
 * and exposes the latest artisan location + a coarse connection state. The
 * connection is torn down on unmount or when the booking id changes.
 */
export function useLiveTracking(bookingId: string | undefined) {
  const [location, setLocation] = useState<LocationUpdate | null>(null);
  const [state, setState] = useState<TrackingState>('idle');
  const connRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setState('idle');
      return;
    }

    let cancelled = false;
    const conn = buildConnection();
    connRef.current = conn;

    conn.on('LocationUpdated', (update: LocationUpdate) => {
      if (!cancelled) {
        setLocation(update);
        setState('tracking');
      }
    });
    conn.on('TrackingStarted', () => !cancelled && setState((s) => (s === 'tracking' ? s : 'tracking')));
    conn.on('TrackingEnded', () => !cancelled && setState('ended'));
    conn.on('TrackingError', () => !cancelled && setState('error'));
    conn.onreconnecting(() => !cancelled && setState('connecting'));

    setState('connecting');
    (async () => {
      try {
        await conn.start();
        if (cancelled) return;
        await conn.invoke('JoinBookingTracking', bookingId);
        if (!cancelled) setState('tracking');
      } catch {
        if (!cancelled) setState('error');
      }
    })();

    return () => {
      cancelled = true;
      conn.stop().catch(() => {});
      connRef.current = null;
    };
  }, [bookingId]);

  // REST fallback: poll the latest recorded position so the map still moves
  // when the hub socket is down (flaky networks and tunnels drop long-lived
  // WebSockets). Hub events win when they're newer.
  //
  // It is a FALLBACK, so it only runs when the socket is not carrying the data
  // already. Unconditionally, it was 12 requests a minute per tracked booking
  // alongside a perfectly healthy WebSocket — 72,000 redundant requests an hour
  // at a hundred concurrent jobs, and a visible share of the customer's battery
  // while they watch the map. It also outlived TrackingEnded, because the
  // handler set state but never cleared the timer.
  // Derived, not `state` itself, so the poll is not torn down and rebuilt on
  // every connecting/tracking transition — only when the trip actually ends.
  const ended = state === 'ended';

  useEffect(() => {
    if (!bookingId || ended) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Consecutive polls with the socket still down. The gap widens with it, so
    // a long outage costs a request every 30s rather than every 5.
    let misses = 0;

    const delay = () => BACKOFF_MS[Math.min(misses, BACKOFF_MS.length - 1)];

    const tick = async () => {
      if (stopped) return;

      // Socket healthy, or the trip is over — nothing to fall back to. Keep the
      // loop alive at the slowest cadence so it resumes the moment the socket
      // drops, without polling for data the hub is already delivering.
      const conn = connRef.current;
      const healthy = conn?.state === HubConnectionState.Connected;
      if (healthy) {
        misses = 0;
      } else {
        try {
          const latest = await getLatestLocation(bookingId);
          if (stopped) return;
          if (latest) {
            setLocation((prev) =>
              prev && new Date(prev.atUtc).getTime() >= new Date(latest.atUtc).getTime()
                ? prev
                : latest,
            );
            setState((s) => (s === 'ended' ? s : 'tracking'));
          }
        } catch {
          // fallback only — the hub path still applies
        }
        misses += 1;
      }

      if (!stopped) timer = setTimeout(tick, healthy ? IDLE_CHECK_MS : delay());
    };

    // One immediate read, so the map has a position before the socket finishes
    // its handshake.
    void (async () => {
      try {
        const latest = await getLatestLocation(bookingId);
        if (!stopped && latest) setLocation(latest);
      } catch {
        // the hub is the primary path
      }
    })();
    timer = setTimeout(tick, BACKOFF_MS[0]);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [bookingId, ended]);

  return { location, state };
}

/**
 * Artisan-side location streaming. Maintains a hub connection and returns a
 * `send` function the GPS watcher calls with each fix. `ready` is true once the
 * connection is live. No-ops when not `enabled` (e.g. before the trip starts).
 */
export function useLocationStreamer(bookingId: string | undefined, enabled: boolean) {
  const connRef = useRef<HubConnection | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!bookingId || !enabled) return;

    let cancelled = false;
    const conn = buildConnection();
    connRef.current = conn;

    (async () => {
      try {
        await conn.start();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(false);
      }
    })();

    return () => {
      cancelled = true;
      setReady(false);
      conn.stop().catch(() => {});
      connRef.current = null;
    };
  }, [bookingId, enabled]);

  const send = useCallback(
    (coords: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      heading?: number | null;
      speed?: number | null;
    }) => {
      if (!bookingId) return;
      const conn = connRef.current;
      if (conn && conn.state === HubConnectionState.Connected) {
        conn
          .invoke(
            'SendLocationUpdate',
            bookingId,
            coords.latitude,
            coords.longitude,
            coords.accuracy ?? null,
            coords.heading ?? null,
            coords.speed ?? null,
          )
          // Invoke failed mid-flight — persist the fix over REST instead.
          .catch(() => sendLocationPing(bookingId, coords).catch(() => {}));
      } else {
        // Hub socket down — REST keeps the pings flowing (and the server still
        // broadcasts them to hub watchers).
        sendLocationPing(bookingId, coords).catch(() => {});
      }
    },
    [bookingId],
  );

  return { ready, send };
}
