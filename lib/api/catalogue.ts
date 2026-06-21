import { apiClient } from '@/lib/api/client';
import type {
  ArtisanDetail,
  ArtisanSummary,
  Category,
} from '@/lib/catalogue/types';

/**
 * Marketplace catalogue endpoints (PRD §Marketplace). Read-only and open to
 * guests, so these never require a token.
 */

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/api/v1/categories');
  return data;
}

export async function getArtisans(categorySlug?: string): Promise<ArtisanSummary[]> {
  const { data } = await apiClient.get<ArtisanSummary[]>('/api/v1/artisans', {
    params: categorySlug ? { category: categorySlug } : undefined,
  });
  return data;
}

export async function getArtisan(id: string): Promise<ArtisanDetail> {
  const { data } = await apiClient.get<ArtisanDetail>(`/api/v1/artisans/${id}`);
  return data;
}
