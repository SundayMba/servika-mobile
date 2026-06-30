import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cancelBooking,
  createBooking,
  getBooking,
  getBookings,
} from '@/lib/api/bookings';

/**
 * TanStack Query hooks for bookings. Bookings are per-customer and change as the
 * job progresses, so they get a short stale time and mutations invalidate the
 * cached list/detail so the UI re-fetches.
 */

export function useBookings(status?: string) {
  return useQuery({
    queryKey: ['bookings', { status: status ?? null }],
    queryFn: () => getBookings(status),
    staleTime: 30_000,
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
