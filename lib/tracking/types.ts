/**
 * Live-tracking shapes mirroring the backend SignalR contract
 * (Servika.Contracts.Tracking + the hub events). Hub at /hubs/tracking.
 */

/** Payload of the server `LocationUpdated` event (matches Contracts.LocationUpdate). */
export interface LocationUpdate {
  bookingId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  atUtc: string;
}

/** A point on a route polyline (matches Contracts.GeoPoint). */
export interface RoutePoint {
  latitude: number;
  longitude: number;
}

/** Response from GET /api/v1/tracking/route. `provider` is "google" (real road
 *  geometry + traffic ETA) or "stub" (straight line + average-speed ETA). */
export interface RouteResponse {
  points: RoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
  provider: string;
}

/** Connection/tracking state surfaced to the screens. */
export type TrackingState =
  | 'idle' // no booking id yet
  | 'connecting'
  | 'tracking' // joined; waiting for or receiving pings
  | 'ended' // artisan arrived / session ended
  | 'error';
