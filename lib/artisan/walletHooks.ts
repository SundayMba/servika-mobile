import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getArtisanWallet,
  getArtisanWithdrawals,
  requestWithdrawal,
} from '@/lib/api/artisanWallet';

/**
 * TanStack Query hooks for artisan earnings + payouts. The wallet balance and
 * history change when a job is paid or a withdrawal is made, so a successful
 * withdrawal invalidates both.
 */

export function useArtisanWallet(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['artisan-wallet'],
    queryFn: getArtisanWallet,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

export function useArtisanWithdrawals(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['artisan-withdrawals'],
    queryFn: getArtisanWithdrawals,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisan-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['artisan-withdrawals'] });
    },
  });
}
