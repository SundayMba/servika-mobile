import * as WebBrowser from 'expo-web-browser';

import { getBooking } from '@/lib/api/bookings';
import { initializePayment } from '@/lib/api/payments';
import type { PaymentInitResponse } from '@/lib/payments/types';

/** The deep link the backend gives Paystack as callback_url (PaymentReturnLinks). */
export const PAYMENT_RETURN_URL = 'servika://payment/callback';

export type CheckoutOutcome =
  /** The webhook settled it: the booking now reads Paid. */
  | { status: 'paid'; init: PaymentInitResponse }
  /** The checkout closed but the booking is not Paid yet: not paid, or the
   *  webhook is still on its way. The caller should refetch, not celebrate. */
  | { status: 'unconfirmed'; init: PaymentInitResponse };

/**
 * Pay for a booking without leaving the app. The gateway checkout opens in an
 * auth session (a sheet over the app that closes itself when the gateway
 * redirects to our scheme), then we poll the booking until the webhook has
 * marked it Paid. Bank-app hops (OPay, bank apps) return to the sheet.
 *
 * The dev stub returns a non-http URL: nothing to open, the flow completes
 * once the stub webhook is fired by hand.
 */
export async function payForBooking(bookingId: string): Promise<CheckoutOutcome> {
  const init = await initializePayment(bookingId);

  if (init.authorizationUrl && /^https?:/i.test(init.authorizationUrl)) {
    await WebBrowser.openAuthSessionAsync(init.authorizationUrl, PAYMENT_RETURN_URL, {
      preferEphemeralSession: true,
    });
  }

  const paid = await waitForPaid(bookingId);
  return { status: paid ? 'paid' : 'unconfirmed', init };
}

/** Polls the booking for up to ~15s; the webhook normally lands within 1-3s. */
async function waitForPaid(bookingId: string, attempts = 10, everyMs = 1500) {
  for (let i = 0; i < attempts; i++) {
    try {
      const b = await getBooking(bookingId);
      if (b.paymentState === 'Paid') return true;
    } catch {
      /* transient: keep polling */
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
  return false;
}
