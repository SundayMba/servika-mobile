import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getBanks, getMyReferrals, requestReferralWithdrawal } from '@/lib/api/referrals';

/** The signed-in user's referral dashboard (code, earnings, referred artisans). */
export function useMyReferrals(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: getMyReferrals,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}

/** Cash out the referral pool; refreshes the dashboard (available/paid-out) on success. */
export function useRequestReferralWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestReferralWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals', 'me'] });
    },
  });
}

/** Payout-destination bank list for the withdrawal picker (cached for the session). */
export function useBanks() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: getBanks,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
