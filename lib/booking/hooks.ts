import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  acceptBid,
  cancelBooking,
  choosePaymentMethod,
  completeBooking,
  createBooking,
  getBooking,
  getBookingBids,
  getBookings,
  getJobCompletion,
  rebroadcastBooking,
} from '@/lib/api/bookings';

/**
 * TanStack Query hooks for bookings. Bookings are per-customer and change as the
 * job progresses, so they get a short stale time and mutations invalidate the
 * cached list/detail so the UI re-fetches.
 */

export function useBookings(status?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['bookings', { status: status ?? null }],
    queryFn: () => getBookings(status),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBooking(id as string),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.setQueryData(['booking', booking.id], booking);
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.setQueryData(['booking', booking.id], booking);
    },
  });
}

/** Customer confirms the job is complete (AwaitingConfirmation/InProgress → Completed). */
export function useCompleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeBooking,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.setQueryData(['booking', booking.id], booking);
    },
  });
}

/** The artisan's proof-of-work (note + photos) for a booking. */
export function useJobCompletion(id: string | undefined) {
  return useQuery({
    queryKey: ['job-completion', id],
    queryFn: () => getJobCompletion(id as string),
    enabled: !!id,
  });
}

/** The bids on an open RemoteQuote request (polled — offers trickle in). */
export function useBookingBids(
  bookingId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['booking-bids', bookingId],
    queryFn: () => getBookingBids(bookingId as string),
    enabled: (options?.enabled ?? true) && !!bookingId,
    refetchInterval: 30_000,
  });
}

/** Accept a bid → the booking becomes Accepted with that artisan. */
export function useAcceptBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, bidId }: { bookingId: string; bidId: string }) =>
      acceptBid(bookingId, bidId),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', booking.id], booking);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-bids', booking.id] });
    },
  });
}

/** Re-broadcast a stalled direct request to every matching artisan. */
export function useRebroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => rebroadcastBooking(bookingId),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', booking.id], booking);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-bids', booking.id] });
    },
  });
}

/** Pick escrow ("online") or "cash" for the agreed price. */
export function useChoosePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      method,
    }: {
      bookingId: string;
      method: 'online' | 'cash';
    }) => choosePaymentMethod(bookingId, method),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', booking.id], booking);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
