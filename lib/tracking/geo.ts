/**
 * Geo helpers for live tracking — distance, ETA, and positioning nearby artisans
 * around a point. Pure functions, no dependencies.
 */

export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Great-circle distance between two points, in kilometres (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Estimated minutes to arrive. Prefers the live GPS speed when it's meaningful
 * (> ~1 m/s), otherwise assumes a city-traffic average (Lagos ≈ 22 km/h). Always
 * at least 1 minute so the UI never shows "0 min" while still en route.
 */
export function etaMinutes(distance: number, speedMetersPerSecond?: number | null): number {
  const liveKmh = speedMetersPerSecond && speedMetersPerSecond > 1 ? speedMetersPerSecond * 3.6 : 0;
  const speedKmh = liveKmh > 0 ? liveKmh : 22;
  const minutes = (distance / speedKmh) * 60;
  return Math.max(1, Math.round(minutes));
}

/** "1.2 km" / "850 m" for display. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Place a point `km` kilometres from `origin` at a given bearing (degrees).
 * Used to scatter "nearby artisans" around the customer for the map — the
 * catalogue only carries a distance, not real coordinates, so we fan them out
 * deterministically (real artisan coordinates are a later backend addition).
 */
export function destinationPoint(origin: LatLng, km: number, bearingDeg: number): LatLng {
  const angular = km / EARTH_RADIUS_KM;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(origin.latitude);
  const lng1 = toRad(origin.longitude);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );

  return { latitude: toDeg(lat2), longitude: toDeg(lng2) };
}

/** Initial bearing from `a` to `b`, in degrees (0–360) — orients the artisan marker. */
export function bearing(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** A map region that comfortably frames both points with padding. */
export function regionFor(a: LatLng, b: LatLng) {
  const latDelta = Math.max(Math.abs(a.latitude - b.latitude) * 2.2, 0.01);
  const lngDelta = Math.max(Math.abs(a.longitude - b.longitude) * 2.2, 0.01);
  return {
    latitude: (a.latitude + b.latitude) / 2,
    longitude: (a.longitude + b.longitude) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}
