/**
 * Booking shapes mirroring the backend Contracts (Servika.Contracts.Bookings).
 * ASP.NET Core serialises camelCase, so these match the JSON on the wire.
 * `status`, `urgency` and `pricingModel` arrive as readable strings.
 */

/** The full booking state machine (only a subset is reachable in this slice). */
export type BookingStatus =
  | 'Draft'
  | 'Open'
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'OnMyWay'
  | 'Arrived'
  | 'InProgress'
  | 'AwaitingConfirmation'
  | 'Completed'
  | 'Cancelled'
  | 'Disputed'
  | 'Expired';

export type Urgency = 'standard' | 'urgent';

/** Artisan's proof-of-work for a booking (GET /bookings/{id}/completion). */
export interface JobCompletion {
  status: BookingStatus;
  note: string | null;
  submittedAtUtc: string | null;
  /** Photos as base64 data URIs the app renders directly. */
  photos: string[];
}

/** Artisan submits proof of completed work. */
export interface SubmitCompletionRequest {
  note?: string | null;
  photosBase64: string[];
}

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
  /** "Inspection" (artisan checks in person — default) or "RemoteQuote"
   * (artisans bid a price from the photos/video). Open requests only. */
  assessmentMode?: 'Inspection' | 'RemoteQuote';
  /** Job photos as base64 (max 4). Required context when bidding. */
  mediaBase64?: string[];
  /** A short job video clip as base64. Optional. */
  videoBase64?: string | null;
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
  /** "Inspection" or "RemoteQuote" (bidding). */
  assessmentMode: 'Inspection' | 'RemoteQuote';
  /** API paths of the customer's job photos. */
  mediaUrls: string[];
  /** API path of the customer's short job video, or null. */
  videoUrl: string | null;
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
  paymentState: string;
  initialQuoteAmountNaira: number | null;
  commissionRate: number;
  createdAt: string;
  acceptedAtUtc: string | null;
  completedAtUtc: string | null;
  cancelledAtUtc: string | null;
  assessmentMode: 'Inspection' | 'RemoteQuote';
  mediaUrls: string[];
  videoUrl: string | null;
  /** Active bids while the request is open for offers; 0 otherwise. */
  bidCount: number;
}

/** An artisan's price offer on an open RemoteQuote request. */
export interface Bid {
  id: string;
  bookingId: string;
  artisanId: string;
  artisanName: string;
  rating: number;
  reviewCount: number;
  hasCertificate: boolean;
  photoUrl: string | null;
  amountNaira: number;
  materialsNote: string | null;
  status: 'Active' | 'Accepted' | 'Closed';
  createdAtUtc: string;
}
