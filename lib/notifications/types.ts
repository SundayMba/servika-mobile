/** Mirrors the backend `NotificationDto` / `UnreadCountDto`. */

export type NotificationType = 'Booking' | 'Payment' | 'System';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Booking to open when tapped, if any. */
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type UnreadCount = { count: number };
