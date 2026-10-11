import { apiClient } from '@/lib/api/client';
import type { ArtisanSummary } from '@/lib/catalogue/types';
import type { LatLng } from '@/lib/tracking/geo';

/** Customer's saved artisans (PRD §Marketplace). Auth-gated, scoped to the user. */

export async function getFavorites(coords?: LatLng | null): Promise<ArtisanSummary[]> {
  const { data } = await apiClient.get<ArtisanSummary[]>('/api/v1/favorites', {
    params: coords ? { lat: coords.latitude, lng: coords.longitude } : undefined,
  });
  return data;
}

export async function addFavorite(artisanId: string): Promise<void> {
  await apiClient.post(`/api/v1/artisans/${artisanId}/favorite`);
}

export async function removeFavorite(artisanId: string): Promise<void> {
  await apiClient.delete(`/api/v1/artisans/${artisanId}/favorite`);
}
