import { apiClient } from '@/lib/api/client';
import type { Dispute, RaiseDisputeRequest } from '@/lib/disputes/types';

/**
 * Customer dispute endpoints (PRD §Disputes). Auth-gated and scoped to the caller's
 * own booking. Admin resolution lives behind role-gated endpoints (no mobile UI).
 */

export async function raiseDispute(
  bookingId: string,
  body: RaiseDisputeRequest,
): Promise<Dispute> {
  const { data } = await apiClient.post<Dispute>(
    `/api/v1/bookings/${bookingId}/dispute`,
    body,
  );
  return data;
}

export async function getBookingDispute(bookingId: string): Promise<Dispute> {
  const { data } = await apiClient.get<Dispute>(
    `/api/v1/bookings/${bookingId}/dispute`,
  );
  return data;
}
