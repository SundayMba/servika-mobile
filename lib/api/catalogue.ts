import { apiClient } from '@/lib/api/client';
import type {
  FeaturedService,
  ArtisanDetail,
  ArtisanSummary,
  Category,
  ArtisanByCode,
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

/** Resolve an artisan's personal booking code (404 = no such code). */
export async function getArtisanByCode(code: string): Promise<ArtisanByCode> {
  const clean = code.trim().split('/').pop()?.replace(/[^a-z0-9]/gi, '').toUpperCase() ?? '';
  const { data } = await apiClient.get<ArtisanByCode>(`/api/v1/artisans/by-code/${encodeURIComponent(clean)}`);
  return data;
}

export async function getArtisan(id: string, coords?: LatLng | null): Promise<ArtisanDetail> {
  const { data } = await apiClient.get<ArtisanDetail>(`/api/v1/artisans/${id}`, {
    params: coords ? { lat: coords.latitude, lng: coords.longitude } : undefined,
  });
  return data;
}

