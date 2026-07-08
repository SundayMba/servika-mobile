import { apiClient } from '@/lib/api/client';
import type { ArtisanSummary } from '@/lib/catalogue/types';

/** Customer's saved artisans (PRD §Marketplace). Auth-gated, scoped to the user. */

export async function getFavorites(): Promise<ArtisanSummary[]> {
  const { data } = await apiClient.get<ArtisanSummary[]>('/api/v1/favorites');
  return data;
}

export async function addFavorite(artisanId: string): Promise<void> {
  await apiClient.post(`/api/v1/artisans/${artisanId}/favorite`);
}

export async function removeFavorite(artisanId: string): Promise<void> {
  await apiClient.delete(`/api/v1/artisans/${artisanId}/favorite`);
}
