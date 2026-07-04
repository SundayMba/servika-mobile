/**
 * Review shapes mirroring the backend Contracts (Servika.Contracts.Reviews).
 * ASP.NET Core serialises camelCase, so these match the JSON on the wire.
 */

export interface Review {
  id: string;
  bookingId: string;
  artisanId: string;
  /** Denormalised reviewer name for display, e.g. "Modupe A.". */
  customerName: string;
  /** Stars, 1–5. */
  rating: number;
  comment: string | null;
  /** The booking's service name, e.g. "Plumbing". */
  serviceName: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
}

/** POST /api/v1/bookings/{id}/review body. */
export interface SubmitReviewRequest {
  rating: number;
  comment?: string | null;
}
