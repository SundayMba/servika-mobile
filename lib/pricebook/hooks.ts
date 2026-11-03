import { useQuery } from '@tanstack/react-query';

import { getCategoryCustomJobs, getCategoryPriceBook, getPopularPriceBook, getPriceBookItem } from '@/lib/api/priceBook';

/** Prices change only when ops change them, so a few minutes of cache is plenty. */
const STALE = 5 * 60_000;

export function usePopularPriceBook() {
  return useQuery({ queryKey: ['price-book', 'popular'], queryFn: getPopularPriceBook, staleTime: STALE });
}

export function useCategoryPriceBook(slug: string | undefined) {
  return useQuery({
    queryKey: ['price-book', 'category', slug],
    queryFn: () => getCategoryPriceBook(slug as string),
    enabled: !!slug,
    staleTime: STALE,
  });
}

export function useCategoryCustomJobs(slug: string | undefined) {
  return useQuery({
    queryKey: ['price-book', 'custom', slug],
    queryFn: () => getCategoryCustomJobs(slug as string),
    enabled: !!slug,
    staleTime: STALE,
  });
}

export function usePriceBookItem(id: string | undefined) {
  return useQuery({
    queryKey: ['price-book', 'item', id],
    queryFn: () => getPriceBookItem(id as string),
    enabled: !!id,
    staleTime: STALE,
    retry: false,
  });
}

/** "About 1 hr 30 min" from minutes, or null. */
export function durationLabel(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `About ${m} min`;
  return `About ${h} hr${m ? ` ${m} min` : ''}`;
}
