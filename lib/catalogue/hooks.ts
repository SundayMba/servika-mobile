import { useQuery, type QueryClient } from '@tanstack/react-query';
import {
  getArtisan,
  getCategories,
  getArtisanByCode,
} from '@/lib/api/catalogue';
import { useSelectedCoords } from '@/lib/location/areaStore';
import type { LatLng } from '@/lib/tracking/geo';

/**
 * TanStack Query hooks for the marketplace catalogue. Categories and artisan
 * lists are reference data that changes rarely, so they get a longer stale time.
 */

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  });
}

/** An artisan by their booking code; a 404 is "no such code" (retry off). */
export function useArtisanByCode(code: string | undefined) {
  return useQuery({
    queryKey: ['artisan-by-code', code],
    queryFn: () => getArtisanByCode(code as string),
    enabled: !!code && code.replace(/[^a-z0-9]/gi, '').length >= 3,
    retry: false,
    staleTime: 60_000,
  });
}

export function useArtisan(id: string | undefined) {
  const coords = useSelectedCoords();
  return useQuery({
    queryKey: ['artisan', id, coordsKey(coords)],
    queryFn: () => getArtisan(id as string, coords),
    enabled: !!id,
  });
}

/** Coords rounded to ~100 m so a wobbling GPS fix doesn't refetch every tick. */
function coordsKey(coords?: LatLng | null) {
  return coords
    ? [Math.round(coords.latitude * 1000) / 1000, Math.round(coords.longitude * 1000) / 1000]
    : null;
}

/**
 * A profile or service the app still lists came back 404: the provider was
 * removed or unverified since the list was fetched. Drop every catalogue list
 * so Home, Explore and the services screen refetch instead of showing it again.
 */
export function invalidateCatalogueLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['artisans'] }),
    queryClient.invalidateQueries({ queryKey: ['featured-services'] }),
    queryClient.invalidateQueries({ queryKey: ['nearby-services'] }),
  ]);
}
