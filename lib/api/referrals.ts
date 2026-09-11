import { apiClient } from '@/lib/api/client';
import type {
  Bank,
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

/** Payout-destination banks (name + code) for the withdrawal picker. */
/** The bank's name for an account number (cached server-side; ten checks a day). 404 = no such account. */
export type BankAccountResolution = { bankCode: string; accountNumber: string; accountName: string };
export async function resolveBankAccount(bankCode: string, accountNumber: string): Promise<BankAccountResolution> {
  const { data } = await apiClient.get<BankAccountResolution>('/api/v1/banks/resolve', { params: { bankCode, accountNumber }, timeout: 30_000 });
  return data;
}

export async function getBanks(): Promise<Bank[]> {
  const { data } = await apiClient.get<Bank[]>('/api/v1/banks');
  return data;
}
