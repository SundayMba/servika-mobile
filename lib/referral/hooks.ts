import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getMyReferrals, requestReferralWithdrawal } from '@/lib/api/referrals';

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
