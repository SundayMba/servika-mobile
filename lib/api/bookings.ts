import { apiClient } from '@/lib/api/client';
import type {
  BookingDetail,
  BookingSummary,
  CreateBookingRequest,
  JobCompletion,
} from '@/lib/booking/types';

/**
 * Booking endpoints. Thin wrappers over the shared axios client that return typed
 * response bodies. All are auth-gated (the client attaches the bearer token) and
 * scoped server-side to the signed-in customer. Base path /api/v1/bookings.
 */

const BASE = '/api/v1/bookings';

/** Submit a new booking. Returns the created booking (status `Pending`). */
export async function createBooking(
  body: CreateBookingRequest,
): Promise<BookingDetail> {
  const { data } = await apiClient.post<BookingDetail>(BASE, body);
  return data;
}

/** The current customer's bookings (history), newest first; optional status filter. */
export async function getBookings(status?: string): Promise<BookingSummary[]> {
  const { data } = await apiClient.get<BookingSummary[]>(BASE, {
    params: status ? { status } : undefined,
  });
  return data;
}

/** A single booking owned by the current customer. */
export async function getBooking(id: string): Promise<BookingDetail> {
  const { data } = await apiClient.get<BookingDetail>(`${BASE}/${id}`);
  return data;
}

/** Cancel a booking (allowed only while Pending/Accepted). Returns the updated booking. */
export async function cancelBooking(id: string): Promise<BookingDetail> {
  const { data } = await apiClient.post<BookingDetail>(`${BASE}/${id}/cancel`);
  return data;
}

/** Confirm the job is complete (customer). Returns the updated booking (Completed). */
export async function completeBooking(id: string): Promise<BookingDetail> {
  const { data } = await apiClient.post<BookingDetail>(`${BASE}/${id}/complete`);
  return data;
}

/** The artisan's proof-of-work (note + photo data URIs) for the customer to review. */
export async function getJobCompletion(id: string): Promise<JobCompletion> {
  const { data } = await apiClient.get<JobCompletion>(`${BASE}/${id}/completion`);
  return data;
}
