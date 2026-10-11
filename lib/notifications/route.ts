import type { Href } from 'expo-router';

/**
 * Where tapping a notification (in the feed or as a push) takes the customer.
 * One rule set for both, keyed on the event kind when the API sends it.
 */
export function notificationTarget(n: {
  kind?: string | null;
  type?: string | null;
  bookingId?: string | null;
  conversationId?: string | null;
}): Href | null {
  const kind = n.kind ?? null;
  if (kind === 'Chat' || n.type === 'Chat' || n.conversationId) {
    return n.conversationId ? { pathname: '/chat/[id]', params: { id: n.conversationId } } : null;
  }
  // A referral cash-out moved: the referral screen shows the balance and history.
  if (kind === 'Payout') return '/refer';
  // Fee notices are information only; reading them in the feed is the point.
  if (kind === 'FeeNotice') return null;
  // Open-job broadcasts are for artisans (Servika Pro app).
  if (kind === 'OpenJob' || n.type === 'OpenJob') return null;
  // Refunds, bids, counters, work submitted, materials advance, disputes and
  // every booking update open the booking summary.
  if (n.bookingId) return { pathname: '/booking/[id]', params: { id: n.bookingId } };
  return null;
}
