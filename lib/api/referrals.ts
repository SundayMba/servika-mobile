import { apiClient } from '@/lib/api/client';
import type {
  RequestWithdrawalRequest,
  Withdrawal,
} from '@/lib/artisan/walletTypes';
import type { ReferralSummary } from '@/lib/referral/types';

/** Referral dashboard (PRD §Referrals). Auth-gated; scoped to the signed-in user. */
export async function getMyReferrals(): Promise<ReferralSummary> {
  const { data } = await apiClient.get<ReferralSummary>('/api/v1/referrals/me');
  return data;
}

/**
 * Cash out the referral reward pool to a bank account. Shares the artisan payout
 * DTO shape; validated against the ledger-computed pool balance server-side.
 */
export async function requestReferralWithdrawal(
  body: RequestWithdrawalRequest,
): Promise<Withdrawal> {
  const { data } = await apiClient.post<Withdrawal>(
    '/api/v1/referrals/withdrawals',
    body,
  );
  return data;
}
