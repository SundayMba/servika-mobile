import { apiClient } from '@/lib/api/client';
import type {
  ArtisanWallet,
  RequestWithdrawalRequest,
  Withdrawal,
} from '@/lib/artisan/walletTypes';

/**
 * Artisan earnings + payouts (PRD §Payments and Wallet). All require a bearer
 * token for an Artisan-role account and are scoped server-side to their profile.
 */

export async function getArtisanWallet(): Promise<ArtisanWallet> {
  const { data } = await apiClient.get<ArtisanWallet>('/api/v1/artisan/wallet');
  return data;
}

export async function getArtisanWithdrawals(): Promise<Withdrawal[]> {
  const { data } = await apiClient.get<Withdrawal[]>('/api/v1/artisan/withdrawals');
  return data;
}

export async function requestWithdrawal(
  body: RequestWithdrawalRequest,
): Promise<Withdrawal> {
  const { data } = await apiClient.post<Withdrawal>(
    '/api/v1/artisan/withdrawals',
    body,
  );
  return data;
}
