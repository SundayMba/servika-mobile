import { useQuery } from '@tanstack/react-query';

import { getFeeQuote, getFeeSchedule } from '@/lib/api/payments';

/** The fee schedule; changes only when the admin changes it. */
export function useFeeSchedule() {
  return useQuery({ queryKey: ['fee-schedule'], queryFn: getFeeSchedule, staleTime: 5 * 60_000 });
}

/** Server-computed payment fee for an amount (0 while Servika covers it). */
export function useFeeQuote(amountNaira: number | null | undefined, enabled = true) {
  const amount = amountNaira ?? 0;
  return useQuery({
    queryKey: ['fee-quote', amount],
    queryFn: () => getFeeQuote(amount),
    enabled: enabled && amount > 0,
    staleTime: 60_000,
  });
}

/** "12 December 2026" in Lagos time, or null when no date is scheduled. */
export function feeStartLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
}
