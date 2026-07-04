import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getArtisanReviews,
  getBookingReview,
  submitReview,
} from '@/lib/api/reviews';
import type { SubmitReviewRequest } from '@/lib/reviews/types';

/**
 * TanStack Query hooks for reviews. The artisan list is reference-ish (short
 * stale time); submitting a review updates the artisan's rating aggregate, so
 * the mutation invalidates the artisan profile + lists too.
 */

/** An artisan's public reviews (newest first). */
export function useArtisanReviews(artisanId: string | undefined) {
  return useQuery({
    queryKey: ['artisan-reviews', artisanId],
    queryFn: () => getArtisanReviews(artisanId as string),
    enabled: !!artisanId,
    staleTime: 60_000,
  });
}

/** The current customer's review for a booking. A 404 (not yet reviewed) is an
 *  expected empty state, so it isn't retried; callers treat an error as "none". */
export function useBookingReview(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['booking-review', bookingId],
    queryFn: () => getBookingReview(bookingId as string),
    enabled: !!bookingId,
    retry: false,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      body,
    }: {
      bookingId: string;
      body: SubmitReviewRequest;
    }) => submitReview(bookingId, body),
    onSuccess: (review) => {
      qc.setQueryData(['booking-review', review.bookingId], review);
      qc.invalidateQueries({ queryKey: ['artisan-reviews', review.artisanId] });
      // The artisan's rating aggregate changed — refresh their profile + lists.
      qc.invalidateQueries({ queryKey: ['artisan', review.artisanId] });
      qc.invalidateQueries({ queryKey: ['artisans'] });
    },
  });
}

/** Compact relative time for review timestamps, e.g. "2d ago", "just now". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
