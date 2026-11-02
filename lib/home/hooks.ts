import { useMutation, useQuery } from '@tanstack/react-query';

import { getAvailability, recordServiceInterest } from '@/lib/api/home';

/** Show "N artisans available near you" only from this many; fewer reads worse than nothing. */
export const AVAILABILITY_THRESHOLD = 3;

export function useAvailability(coords: { latitude: number; longitude: number } | null | undefined) {
  const key = coords ? `${coords.latitude.toFixed(3)},${coords.longitude.toFixed(3)}` : 'none';
  return useQuery({
    queryKey: ['availability', key],
    queryFn: () => getAvailability(coords ?? null),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useRecordInterest() {
  return useMutation({ mutationFn: recordServiceInterest });
}
