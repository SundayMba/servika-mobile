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
};

export type RequestWithdrawalRequest = {
  amountNaira: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
};
