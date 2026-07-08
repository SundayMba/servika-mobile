import { useQuery } from '@tanstack/react-query';

import { getWalletTransactions } from '@/lib/api/payments';

/** The signed-in customer's payment ledger (payments + refunds), newest first. */
export function useWalletTransactions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: getWalletTransactions,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}
