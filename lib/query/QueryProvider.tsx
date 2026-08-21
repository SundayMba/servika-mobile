import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

/**
 * Wraps the app in a TanStack Query client for server-state caching.
 * Defaults are conservative for mobile: limited retries and a short stale
 * window so screens feel fresh without hammering the API.
 */

/**
 * React Query's focus tracking is built on browser events that React Native
 * does not emit, so without this bridge the library believes the app is
 * permanently focused. `refetchOnWindowFocus` being off is not the same thing:
 * `refetchInterval` respects focus (via the default
 * `refetchIntervalInBackground: false`) and therefore never pauses either.
 *
 * The cost of leaving it unwired is paid entirely by backgrounded phones. A
 * signed-in customer with the app merely swiped away keeps polling bookings
 * every 30s, notifications and chat unread every 60s, and availability for up
 * to three artisans every 60s — all of it invisible, all of it on their data
 * and their battery. One subscription fixes every query at once.
 */
function bridgeAppStateToFocus() {
  const onChange = (status: AppStateStatus) => {
    // Web has real focus events of its own; only native needs the bridge.
    if (Platform.OS === 'web') return;
    focusManager.setFocused(status === 'active');
  };
  const sub = AppState.addEventListener('change', onChange);
  onChange(AppState.currentState);
  return () => sub.remove();
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            // Now that focus is wired below, this means what it says: refetch
            // when the customer comes BACK to the app and the data is stale
            // (30s), rather than every 30-60s while they are not looking. It
            // was off before precisely because focus was never reported, so
            // "focus" would have meant "always".
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  useEffect(bridgeAppStateToFocus, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
