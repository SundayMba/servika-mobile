import { apiClient } from '@/lib/api/client';
import type { LatLng } from '@/lib/tracking/geo';
import type { LocationUpdate, RouteResponse } from '@/lib/tracking/types';

/**
 * Tracking REST endpoints (the live position itself flows over the SignalR hub).
 * The route proxy keeps the Google Directions key server-side — the app never
 * holds it. Base path /api/v1/tracking.
 */

/** A driving route + ETA between two points (artisan → destination). */
export async function getRoute(from: LatLng, to: LatLng): Promise<RouteResponse> {
  const { data } = await apiClient.get<RouteResponse>('/api/v1/tracking/route', {
    params: {
      fromLat: from.latitude,
      fromLng: from.longitude,
      toLat: to.latitude,
      toLng: to.longitude,
    },
  });
  return data;
}

/** The artisan's latest recorded position for a booking, or null when there is
 *  no active session yet. REST fallback for when the hub socket is down. */
export async function getLatestLocation(
  bookingId: string,
): Promise<LocationUpdate | null> {
  const res = await apiClient.get<LocationUpdate>(
    `/api/v1/tracking/bookings/${bookingId}/latest`,
    { validateStatus: (s) => s === 200 || s === 204 },
  );
  return res.status === 204 ? null : res.data;
}

/** Record a live-location ping over REST — the artisan's fallback when their
 *  hub socket is down. The server still broadcasts it to hub watchers. */
export async function sendLocationPing(
  bookingId: string,
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  },
): Promise<void> {
  await apiClient.post(`/api/v1/tracking/bookings/${bookingId}/ping`, coords);
}
