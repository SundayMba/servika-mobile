import { initializePayment } from '@/lib/api/payments';
import type { PaymentInitResponse } from '@/lib/payments/types';

/** The deep link the backend gives Paystack as callback_url (PaymentReturnLinks). */
export const PAYMENT_RETURN_URL = 'servika://payment/callback';

/**
 * Starts a booking payment. Returns the init so the caller can open the in-app
 * checkout screen (`/payment/checkout`), which owns the gateway page, the return
 * from OPay or a bank app, and the server-side verification. When the dev stub is
 * in play there is no page to open: `hosted` is false and the payment settles when
 * the stub webhook is fired by hand.
 */
export async function startBookingPayment(bookingId: string): Promise<{ init: PaymentInitResponse; hosted: boolean }> {
  const init = await initializePayment(bookingId);
  const hosted = !!init.authorizationUrl && /^https?:/i.test(init.authorizationUrl);
  return { init, hosted };
}
