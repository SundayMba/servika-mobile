import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { useCallback, useEffect, useRef, useState } from 'react';

import { config } from '@/lib/config';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import type { LocationUpdate, TrackingState } from '@/lib/tracking/types';

const HUB_URL = `${config.apiBaseUrl}/hubs/tracking`;

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
      const conn = connRef.current;
      if (!conn || conn.state !== HubConnectionState.Connected || !bookingId) return;
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
        .catch(() => {});
    },
    [bookingId],
  );

  return { ready, send };
}
