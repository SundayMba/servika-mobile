import { apiClient } from '@/lib/api/client';
import type { CategoryPriceBook, PriceBookItem } from '@/lib/pricebook/types';

/** The "Fixed prices" rail on Home: Servika's popular fixed-price jobs. */
export async function getPopularPriceBook(): Promise<PriceBookItem[]> {
  const { data } = await apiClient.get<PriceBookItem[]>('/api/v1/price-book', { params: { popular: true } });
  return data;
}

/** A category screen's fixed jobs, diagnosis fee and add-on count. */
export async function getCategoryPriceBook(slug: string): Promise<CategoryPriceBook> {
  const { data } = await apiClient.get<CategoryPriceBook>(`/api/v1/price-book/categories/${encodeURIComponent(slug)}`);
  return data;
}

/** One active price-book job. 404 when it is no longer offered. */
export async function getPriceBookItem(id: string): Promise<PriceBookItem> {
  const { data } = await apiClient.get<PriceBookItem>(`/api/v1/price-book/${id}`);
  return data;
}
