/**
 * Small display rules shared by every artisan card and profile, so a fact only
 * shows when the API actually knows it.
 */

/** True only for a real, positive distance. Null/0 means "unknown": show nothing. */
export function hasDistance(km: number | null | undefined): km is number {
  return typeof km === 'number' && Number.isFinite(km) && km > 0;
}

/** "2.4 km" for a known distance, else null. */
export function distanceLabel(km: number | null | undefined): string | null {
  if (!hasDistance(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km * 10) / 10} km`;
}

/** An artisan with no reviews yet is "New", never "0.0". */
export function isNewArtisan(reviewCount: number | null | undefined): boolean {
  return !reviewCount;
}

/** "4.8" or "New". */
export function ratingLabel(rating: number, reviewCount: number | null | undefined): string {
  return isNewArtisan(reviewCount) ? 'New' : rating.toFixed(1);
}
