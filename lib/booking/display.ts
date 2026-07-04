import type { BookingStatus } from '@/lib/booking/types';

/**
 * Presentation helpers shared by the bookings list and detail screens so a
 * status always looks the same. Tailwind/NativeWind class strings for a status
 * "chip" (background + text), and human-friendly date/time formatting.
 */

type ChipStyle = { label: string; bg: string; text: string };

const STATUS_STYLES: Record<BookingStatus, ChipStyle> = {
  Draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-600' },
  Pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700' },
  Accepted: { label: 'Accepted', bg: 'bg-blue-100', text: 'text-blue-700' },
  Rejected: { label: 'Rejected', bg: 'bg-gray-100', text: 'text-gray-600' },
  OnMyWay: { label: 'On the way', bg: 'bg-blue-100', text: 'text-blue-700' },
  Arrived: { label: 'Arrived', bg: 'bg-blue-100', text: 'text-blue-700' },
  InProgress: { label: 'In progress', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  AwaitingConfirmation: { label: 'Awaiting your confirmation', bg: 'bg-orange-100', text: 'text-orange-700' },
  Completed: { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700' },
  Cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500' },
  Disputed: { label: 'Disputed', bg: 'bg-red-100', text: 'text-red-700' },
  Expired: { label: 'Expired', bg: 'bg-gray-100', text: 'text-gray-500' },
};

export function statusStyle(status: BookingStatus): ChipStyle {
  return STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
}

/** A booking can still be cancelled by the customer only in these states. */
export function canCancel(status: BookingStatus): boolean {
  return status === 'Pending' || status === 'Accepted';
}

/** The job is live — the customer can open the tracking map/dashboard. */
export function isTrackable(status: BookingStatus): boolean {
  return (
    status === 'Accepted' ||
    status === 'OnMyWay' ||
    status === 'Arrived' ||
    status === 'InProgress'
  );
}

/** The artisan is actively en route/working → surface live tracking prominently. */
export function isEnRoute(status: BookingStatus): boolean {
  return status === 'OnMyWay' || status === 'Arrived' || status === 'InProgress';
}

/** Artisan submitted proof → the customer needs to review & confirm. */
export function isAwaitingConfirmation(status: BookingStatus): boolean {
  return status === 'AwaitingConfirmation';
}

/**
 * The customer can raise a dispute once work has actually happened — mirrors the
 * backend's disputable states (InProgress / AwaitingConfirmation / Completed).
 */
export function canDispute(status: BookingStatus): boolean {
  return (
    status === 'InProgress' ||
    status === 'AwaitingConfirmation' ||
    status === 'Completed'
  );
}

/** "25 Jun 2026" from an ISO string; empty string if unparseable. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
