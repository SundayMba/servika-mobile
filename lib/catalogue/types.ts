/**
 * Catalogue shapes mirroring the backend Contracts (Servika.Contracts.Catalogue).
 * ASP.NET Core serialises camelCase, so these match the JSON on the wire.
 * Images are NOT sent over the wire — the client resolves bundled artwork from
 * `slug` (categories) and `imageKey`/`galleryKeys` (artisans). See ./assets.ts.
 */

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** Hex tint for the tile wash, e.g. "#F59E0B". */
  tint: string;
  /** Vector-icon key for categories with no tile image (e.g. "tire"). */
  iconKey: string | null;
  sortOrder: number;
  isPopular: boolean;
}

export interface ArtisanSummary {
  id: string;
  imageKey: string;
  fullName: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  isAvailable: boolean;
  accent: string;
  /** Real position for the Explore map pin; null for artisans who haven't
   * shared a location yet (they appear in lists but not on the map). */
  latitude: number | null;
  longitude: number | null;
  /** API path of the artisan's uploaded photo (relative, e.g.
   * "/api/v1/artisans/{id}/photo"), or null — fall back to the bundled
   * `imageKey` art, then to an initials placeholder. */
  photoUrl: string | null;
  /** True when the artisan uploaded a work certificate (trust badge; also
   * boosts their ranking while ratings accumulate). */
  hasCertificate: boolean;
}

export interface ArtisanDetail extends ArtisanSummary {
  /** API path of the artisan's uploaded cover photo (a shot of them at work),
   * or null — fall back to the profile photo, then bundled art. */
  coverPhotoUrl: string | null;
  /** API paths of the artisan's uploaded work-evidence photos, newest first.
   * Empty → fall back to the bundled `galleryKeys` art. */
  galleryUrls: string[];
  experienceYears: number;
  location: string;
  responseTime: string;
  jobsCount: string;
  inspectionFeeNaira: number;
  about: string;
  services: string[];
  galleryKeys: string[];
  /** Category slugs this artisan serves; the first is the primary, used to
   * pre-fill a booking's service category. */
  categorySlugs: string[];
  /** The artisan's published fixed-price services ("Knotless braids —
   * ₦15,000") — bookable directly at that price. Empty for quote-only artisans. */
  pricedServices: ArtisanServiceOffering[];
}

/** A fixed-price service an artisan publishes on their profile. */
export interface ArtisanServiceOffering {
  id: string;
  name: string;
  priceNaira: number;
}
