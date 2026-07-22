import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { config } from '@/lib/config';

const HUB_URL = `${config.apiBaseUrl}/hubs/notifications`;

/**
 * Real-time notifications: while signed in, keeps a SignalR connection to the
 * per-user notifications hub and, on every `NotificationReceived`, refreshes the
 * data the event may have changed — so "artisan accepted", "on the way",
 * "payment received" etc. land the instant they happen instead of on the next
 * poll. (The device push still fires in parallel for the backgrounded case.)
 */
export function useNotificationsRealtime() {
  const queryClient = useQueryClient();
  const { status } = useAuth();
  const authenticated = status === 'authenticated';

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;
    const conn: HubConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: async () => (await tokenStorage.getAccessToken()) ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Critical) // transient WS drops auto-reconnect; don't spam console.error / dev LogBox
      .build();

    conn.on('NotificationReceived', () => {
      if (cancelled) return;
      // The feed + bell badge, and any booking the event may have moved.
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    });

    conn.start().catch(() => {
      // Best-effort: polling still covers us if the hub can't connect.
    });

    return () => {
      cancelled = true;
      conn.stop().catch(() => {});
    };
  }, [authenticated, queryClient]);
}
