import { useQuery } from '@tanstack/react-query';
import { getArtisan, getArtisans, getCategories } from '@/lib/api/catalogue';

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

/** Home "Nearby Artisans" carousel (no category filter). */
export function useNearbyArtisans() {
  return useQuery({
    queryKey: ['artisans'],
    queryFn: () => getArtisans(),
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
