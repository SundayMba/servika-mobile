import { apiClient } from '@/lib/api/client';
import type { LatLng } from '@/lib/tracking/geo';
import type { RouteResponse } from '@/lib/tracking/types';

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
