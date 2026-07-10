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
}

export interface ArtisanDetail extends ArtisanSummary {
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
}
