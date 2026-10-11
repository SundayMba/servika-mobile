/** Mirrors the backend `NotificationDto` / `UnreadCountDto`. */

export type NotificationType = 'Booking' | 'Payment' | 'System' | 'Chat' | 'OpenJob';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Booking to open when tapped, if any. */
  bookingId: string | null;
  /** Conversation to open when tapped, if any (chat notifications). */
  conversationId: string | null;
  /**
   * Finer event kind (Refund, Payout, FeeNotice, Chat, BidPlaced, CounterAccepted,
   * WorkSubmitted, MaterialsAdvance, Dispute, DisputeResolved, ...). Missing on
   * older APIs; routing falls back to type/bookingId.
   */
  kind?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type UnreadCount = { count: number };
