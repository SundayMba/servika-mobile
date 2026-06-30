/**
 * Booking shapes mirroring the backend Contracts (Servika.Contracts.Bookings).
 * ASP.NET Core serialises camelCase, so these match the JSON on the wire.
 * `status`, `urgency` and `pricingModel` arrive as readable strings.
 */

/** The full booking state machine (only a subset is reachable in this slice). */
export type BookingStatus =
  | 'Draft'
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'OnMyWay'
  | 'Arrived'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed'
  | 'Expired';

export type Urgency = 'standard' | 'urgent';

/** POST /api/v1/bookings body. Pricing/commission are decided server-side. */
export interface CreateBookingRequest {
  categorySlug: string;
  artisanId?: string | null;
  description: string;
  /** ISO-8601 datetime. */
  preferredDate: string;
  preferredTimeSlot: string;
  urgency: Urgency;
  addressText: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationInstructions?: string | null;
}

/** A row in the customer's "My Bookings" history (GET /api/v1/bookings). */
export interface BookingSummary {
  id: string;
  status: BookingStatus;
  serviceName: string;
  artisanName: string | null;
  addressText: string;
  preferredDate: string;
  preferredTimeSlot: string;
  urgency: string;
  amountNaira: number | null;
  createdAt: string;
}

/** The full booking record (GET /api/v1/bookings/{id} and the create response). */
export interface BookingDetail {
  id: string;
  status: BookingStatus;
  customerId: string;
  artisanId: string | null;
  categorySlug: string;
  serviceName: string;
  artisanName: string | null;
  description: string;
  addressText: string;
  locationLat: number | null;
  locationLng: number | null;
  locationInstructions: string | null;
  preferredDate: string;
  preferredTimeSlot: string;
  urgency: string;
  pricingModel: string;
  initialQuoteAmountNaira: number | null;
  commissionRate: number;
  createdAt: string;
  acceptedAtUtc: string | null;
  completedAtUtc: string | null;
  cancelledAtUtc: string | null;
}
