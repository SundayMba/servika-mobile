/**
 * Payment shapes mirroring the backend Contracts (Servika.Contracts.Payments).
 * ASP.NET Core serialises camelCase, so these match the JSON on the wire.
 */

/** Result of POST /payments/bookings/{id}/initialize. */
export interface PaymentInitResponse {
  paymentId: string;
  /** "Pending" until the gateway webhook settles it. */
  status: string;
  reference: string;
  /** Gateway-hosted checkout URL to open; null for providers that don't redirect. */
  authorizationUrl: string | null;
  /** The agreed price going into escrow. */
  amountNaira: number;
  /** The payment fee added on top (0 while Servika covers fees). */
  serviceFeeNaira: number;
  /** What the card is charged: amount + fee. */
  totalNaira: number;
}

/** GET /fees: who pays transaction fees and from when. */
export interface FeeSchedule {
  feesStartAtUtc: string | null;
  usersBearFees: boolean;
  daysUntilFees: number | null;
  cardFeeRate: number;
  cardFeeFlatNaira: number;
  cardFeeFlatFromNaira: number;
  cardFeeCapNaira: number;
  transferFeeTiers: { upToNaira: number | null; feeNaira: number }[];
}

/** GET /fees/quote?amount=: the exact fees for an amount, computed server-side. */
export interface FeeQuote {
  amountNaira: number;
  serviceFeeNaira: number;
  totalNaira: number;
  transferFeeNaira: number;
  netNaira: number;
  usersBearFees: boolean;
  feesStartAtUtc: string | null;
}

export interface Wallet {
  balanceNaira: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amountNaira: number;
  bookingId: string | null;
  description: string;
  createdAt: string;
}
