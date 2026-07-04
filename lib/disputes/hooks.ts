import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getBookingDispute, raiseDispute } from '@/lib/api/disputes';
import type { RaiseDisputeRequest } from '@/lib/disputes/types';

/**
 * The caller's dispute for a booking. A 404 is the "no dispute yet" state, so
 * retry is off (like the review hook). Pass `undefined` to skip the query.
 */
export function useBookingDispute(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['dispute', bookingId],
    queryFn: () => getBookingDispute(bookingId as string),
    enabled: !!bookingId,
    retry: false,
  });
}

/** Raise a dispute; refreshes the booking (now Disputed) + its dispute record. */
export function useRaiseDispute(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RaiseDisputeRequest) => raiseDispute(bookingId, body),
    onSuccess: (dispute) => {
      queryClient.setQueryData(['dispute', bookingId], dispute);
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}
