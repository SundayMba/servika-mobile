import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelBooking,
  completeBooking,
  createBooking,
  getBooking,
  getBookings,
  getJobCompletion,
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
