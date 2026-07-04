import { apiClient } from '@/lib/api/client';
import type { Review, SubmitReviewRequest } from '@/lib/reviews/types';

/**
 * Review endpoints. Submitting + reading your own review are auth-gated and
 * scoped server-side to the signed-in customer; the artisan reviews list is
 * public (open to guests, like the rest of the catalogue).
 */

/** Submit a review for a completed booking. Returns the created review (201). */
export async function submitReview(
  bookingId: string,
  body: SubmitReviewRequest,
): Promise<Review> {
  const { data } = await apiClient.post<Review>(
    `/api/v1/bookings/${bookingId}/review`,
    body,
  );
  return data;
}

/** The current customer's review for a booking (404 if they haven't reviewed it). */
export async function getBookingReview(bookingId: string): Promise<Review> {
  const { data } = await apiClient.get<Review>(
    `/api/v1/bookings/${bookingId}/review`,
  );
  return data;
}

/** An artisan's customer reviews, newest first. Public. */
export async function getArtisanReviews(artisanId: string): Promise<Review[]> {
  const { data } = await apiClient.get<Review[]>(
    `/api/v1/artisans/${artisanId}/reviews`,
  );
  return data;
}
