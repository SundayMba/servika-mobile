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
  /** The materials receipt the artisan attached, shown apart from the work photos. */
  receiptPhoto?: string | null;
  /** When the job confirms itself if the customer does nothing (null/missing = unknown). */
  autoConfirmAtUtc?: string | null;
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
  /** One of the chosen artisan's published fixed-price services — books at its
   * listed price (server reads the price; never trusted from the client).
   * Requires `artisanId`. */
  artisanServiceId?: string | null;
  /** An artisan's personal booking code or link; the server resolves the artisan from it. */
  bookingCode?: string | null;
  /** Rebooking an artisan who already did a job for you (verified server-side). */
  rebook?: boolean;
  /** A job from Servika's price book: booked at Servika's price and paid upfront. */
  priceBookItemId?: string | null;
  /** "Not sure what's wrong?": a diagnosis visit at Servika's fee, paid upfront and credited. */
  diagnosis?: boolean;
  /** "Something else": a paid visit, then an itemised quote; optionally the listed kind of custom work. */
  customQuote?: boolean;
  customPriceBookItemId?: string | null;
  /** The customer ticked "I'll keep my home safe while the artisan is there". */
  safetyAcknowledged?: boolean;
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
  paymentMethod?: 'Online' | 'Cash';
  paymentState?: string;
  completedAtUtc?: string | null;
  /** "Inspection" or "RemoteQuote" (bidding). */
  assessmentMode: 'Inspection' | 'RemoteQuote';
  /** API paths of the customer's job photos. */
  mediaUrls: string[];
  /** API path of the customer's short job video, or null. */
  videoUrl: string | null;
  /** The assigned artisan profile id (for Book again), or null. */
  artisanId?: string | null;
  /** Rotation | Direct | Code | Rebook. */
  source?: string;
  /** The Servika price-book job this booking is for (paid upfront at Servika's price), if any. */
  priceBookItemId?: string | null;
  /** True while a price-book job waits for its upfront payment; no artisan is offered it yet. */
  awaitingUpfrontPayment?: boolean;
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
  /** The customer's display name — present on the ARTISAN-side job detail
   *  (drives the live map's destination name tag); null customer-side. */
  customerName?: string | null;
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
  /** "Online" (escrow, default) or "Cash" (pay the artisan after service). */
  paymentMethod: 'Online' | 'Cash';
  initialQuoteAmountNaira: number | null;
  /** Labour / materials split of the agreed price when the accepted quote was itemised. */
  agreedWorkmanshipNaira?: number | null;
  agreedMaterialsNaira?: number | null;
  /** The artisan's request to release materials money from escrow before completion. */
  materialsAdvanceStatus?: 'None' | 'Requested' | 'Approved' | 'Declined';
  materialsAdvanceNaira?: number | null;
  /** Amount returned to the customer if refunded (full or partial), else null. */
  refundedAmountNaira?: number | null;
  commissionRate: number;
  createdAt: string;
  acceptedAtUtc: string | null;
  completedAtUtc: string | null;
  cancelledAtUtc: string | null;
  /** When the artisan started the work — drives the live job timer. */
  workStartedAtUtc: string | null;
  /** When an AwaitingConfirmation job confirms itself; null/missing = unknown. */
  autoConfirmAtUtc?: string | null;
  /** How many artisans Servika has offered this job to (Open requests). */
  offerRound?: number;
  /** Set while rotation has nobody left to ask; Servika keeps retrying. */
  offersExhaustedAtUtc?: string | null;
  assessmentMode: 'Inspection' | 'RemoteQuote';
  mediaUrls: string[];
  videoUrl: string | null;
  /** Active bids while the request is open for offers; 0 otherwise. */
  bidCount: number;
  /** The Servika price-book job this booking is for (paid upfront at Servika's price), if any. */
  priceBookItemId?: string | null;
  /** True while a price-book job waits for its upfront payment; no artisan is offered it yet. */
  awaitingUpfrontPayment?: boolean;
  /** Diagnosis visit: the fee paid at booking, credited against the repairs. Null otherwise. */
  diagnosisFeeNaira?: number | null;
  /** Repairs from Servika's list the customer approved on this job. */
  approvedRepairsNaira?: number;
  /** Held in escrow so far, and what is still owed against the agreed price. */
  paidNaira?: number;
  amountDueNaira?: number;
  /** A custom job: a paid visit, then an itemised quote checked against the typical range. */
  isCustomQuote?: boolean;
  typicalRangeMinNaira?: number | null;
  typicalRangeMaxNaira?: number | null;
}

/** One repair the artisan picked from Servika's add-on list, with a photo of the fault. */
export interface BookingRepair {
  id: string;
  priceBookItemId: string;
  round: number;
  name: string;
  labourNaira: number;
  partsNaira: number;
  partsNote: string | null;
  totalNaira: number;
  /** API path of the fault photo (needs the auth header). */
  photoUrl: string;
  status: 'Proposed' | 'Approved' | 'Declined';
  proposedAtUtc: string;
}

/** The repairs on a job and the money picture now. */
export interface BookingRepairs {
  repairs: BookingRepair[];
  diagnosisFeeNaira: number | null;
  approvedRepairsNaira: number;
  agreedTotalNaira: number;
  paidNaira: number;
  amountDueNaira: number;
}

/** An artisan's price offer on an open RemoteQuote request. */
export interface BidMaterialLine {
  name: string;
  quantity: number;
  unitPriceNaira: number;
}

export interface Bid {
  id: string;
  bookingId: string;
  artisanId: string;
  artisanName: string;
  /** Jobs this artisan has finished on Servika. Ratings are private to Servika. */
  completedJobs: number;
  hasCertificate: boolean;
  /** Price = a full price for the job. VisitFirst = the artisan wants to see it before pricing. */
  kind: 'Price' | 'VisitFirst';
  /** VisitFirst only: what the visit costs (0 = free). Credited against the price. */
  visitFeeNaira: number;
  /** When the artisan can come; null = as soon as you pick them. */
  availableFromUtc?: string | null;
  /** On another job right now; availableFromUtc is when they expect to be free. */
  artisanBusy?: boolean;
  photoUrl: string | null;
  /** Total the customer pays: workmanshipNaira + materialsNaira. */
  amountNaira: number;
  /** Labour part of the quote (the part that gets bargained). */
  workmanshipNaira: number;
  /** Sum of the itemised material lines. */
  materialsNaira: number;
  /** Itemised materials/parts; empty for a labour-only quote. */
  materials: BidMaterialLine[];
  materialsNote: string | null;
  /** Your pending counter-offer on workmanship, if any. */
  pendingCounterNaira: number | null;
  pendingCounterNote: string | null;
  counterRounds: number;
  maxCounterRounds: number;
  status: 'Active' | 'Accepted' | 'Closed';
  createdAtUtc: string;
  /** Km from the job to the artisan's base, when both are known. */
  distanceKm: number | null;
  /** Custom quotes: Approved = Servika checked it before you saw it. */
  review?: 'NotNeeded' | 'Pending' | 'Approved' | 'SentBack';
}

/** An artisan you have completed jobs with (GET /bookings/past-artisans). */
export interface PastArtisan {
  artisanId: string;
  fullName: string;
  specialty: string;
  imageKey: string;
  photoUrl: string | null;
  categorySlugs: string[];
  jobsWithYou: number;
  lastBookedAtUtc: string;
  isAvailable: boolean;
  isAway: boolean;
  canBook: boolean;
}
