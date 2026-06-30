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
  amountNaira: number;
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
