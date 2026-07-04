import { apiClient } from '@/lib/api/client';
import type {
  ArtisanDetail,
  ArtisanSummary,
  Category,
} from '@/lib/catalogue/types';
import type { LatLng } from '@/lib/tracking/geo';

/**
 * Marketplace catalogue endpoints (PRD §Marketplace). Read-only and open to
 * guests, so these never require a token.
 */

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/api/v1/categories');
  return data;
}

/**
 * List artisans, optionally filtered to a category. When the customer's
 * coordinates are passed, the server returns real distances and sorts by
 * proximity (available artisans first).
 */
export async function getArtisans(
  categorySlug?: string,
  coords?: LatLng | null,
): Promise<ArtisanSummary[]> {
  const { data } = await apiClient.get<ArtisanSummary[]>('/api/v1/artisans', {
    params: {
      ...(categorySlug ? { category: categorySlug } : {}),
      ...(coords ? { lat: coords.latitude, lng: coords.longitude } : {}),
    },
  });
  return data;
}

export async function getArtisan(id: string): Promise<ArtisanDetail> {
  const { data } = await apiClient.get<ArtisanDetail>(`/api/v1/artisans/${id}`);
  return data;
}
