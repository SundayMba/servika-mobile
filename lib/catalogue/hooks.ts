import { useQuery } from '@tanstack/react-query';
import { getArtisan, getArtisans, getCategories } from '@/lib/api/catalogue';
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

/**
 * Home "Nearby Artisans" carousel (no category filter). Pass the customer's
 * coordinates to sort by real proximity; the coords are part of the query key,
 * so changing your location refetches (rounded to ~100m to avoid churn).
 */
export function useNearbyArtisans(coords?: LatLng | null) {
  const key = coords
    ? { lat: Math.round(coords.latitude * 1000) / 1000, lng: Math.round(coords.longitude * 1000) / 1000 }
    : null;
  return useQuery({
    queryKey: ['artisans', 'nearby', key],
    queryFn: () => getArtisans(undefined, coords),
    staleTime: 60_000,
  });
}

/**
 * Explore map: artisans near the given coordinates, optionally narrowed to a
 * category. Same rounding trick as `useNearbyArtisans` so panning the selected
 * area refetches without churning on every GPS jitter.
 */
export function useExploreArtisans(
  categorySlug: string | null,
  coords?: LatLng | null,
) {
  const key = coords
    ? { lat: Math.round(coords.latitude * 1000) / 1000, lng: Math.round(coords.longitude * 1000) / 1000 }
    : null;
  return useQuery({
    queryKey: ['artisans', 'explore', categorySlug ?? 'all', key],
    queryFn: () => getArtisans(categorySlug ?? undefined, coords),
    staleTime: 60_000,
  });
}

/** Artisans serving a given category slug. */
export function useCategoryArtisans(categorySlug: string | undefined) {
  return useQuery({
    queryKey: ['artisans', { category: categorySlug }],
    queryFn: () => getArtisans(categorySlug),
    enabled: !!categorySlug,
    staleTime: 60_000,
  });
}

export function useArtisan(id: string | undefined) {
  return useQuery({
    queryKey: ['artisan', id],
    queryFn: () => getArtisan(id as string),
    enabled: !!id,
  });
}
