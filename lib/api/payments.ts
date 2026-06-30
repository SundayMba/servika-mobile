import { apiClient } from '@/lib/api/client';
import type {
  PaymentInitResponse,
  Wallet,
  WalletTransaction,
} from '@/lib/payments/types';

/**
 * Payment + wallet endpoints. Thin wrappers over the shared axios client; all are
 * auth-gated (the client attaches the bearer token). The amount is decided
 * server-side from the booking — the client never sends it.
 */

/** Start an escrow payment for a booking; returns the gateway checkout URL. */
export async function initializePayment(
  bookingId: string,
): Promise<PaymentInitResponse> {
  const { data } = await apiClient.post<PaymentInitResponse>(
    `/api/v1/payments/bookings/${bookingId}/initialize`,
  );
  return data;
}

/** The current user's wallet balance. */
export async function getWallet(): Promise<Wallet> {
  const { data } = await apiClient.get<Wallet>('/api/v1/wallet');
  return data;
}

/** The current user's wallet ledger history. */
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const { data } = await apiClient.get<WalletTransaction[]>(
    '/api/v1/wallet/transactions',
  );
  return data;
}
