import { useQuery } from '@tanstack/react-query';

import { getRoute } from '@/lib/api/tracking';
import type { LatLng } from '@/lib/tracking/geo';

// Round to 3 decimals (~110 m) so the route only refetches when the origin moves
// to a new ~110 m cell — natural throttling as the artisan drives, with caching.
const cell = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Fetches a road-snapped route + ETA from `from` to `to` via our backend proxy.
 * Refetches when the origin crosses a ~110 m grid cell (not on every GPS ping)
 * and caches for 20 s, keeping Directions usage low.
 */
export function useRoute(from: LatLng | null | undefined, to: LatLng | null | undefined) {
  return useQuery({
    queryKey: [
      'route',
      from ? cell(from.latitude) : null,
      from ? cell(from.longitude) : null,
      to ? cell(to.latitude) : null,
      to ? cell(to.longitude) : null,
    ],
    queryFn: () => getRoute(from as LatLng, to as LatLng),
    enabled: !!from && !!to,
    staleTime: 20_000,
  });
}
