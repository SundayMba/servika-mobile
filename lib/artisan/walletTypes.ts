/** Mirrors the backend artisan-wallet / withdrawal DTOs. */

export type ArtisanWallet = {
  availableNaira: number;
  totalEarnedNaira: number;
  totalWithdrawnNaira: number;
  currency: string;
};

export type WithdrawalStatus = 'Pending' | 'Paid' | 'Failed';

export type Withdrawal = {
  id: string;
  amountNaira: number;
  status: WithdrawalStatus;
  method: string;
  bankName: string;
  accountNumberMasked: string;
  accountName: string;
  createdAt: string;
  processedAtUtc: string | null;
  /** Transfer charge taken out of this withdrawal (0 while Servika covers it). */
  feeNaira?: number;
  /** What reaches the bank: amount minus the charge. */
  netNaira?: number;
  feeBearer?: string;
};

export type RequestWithdrawalRequest = {
  amountNaira: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  /** Provider bank code from the bank picker (required for a real transfer). */
  bankCode?: string;
};

/** A payout-destination bank (name + provider code) for the withdrawal picker. */
export type Bank = { name: string; code: string };
