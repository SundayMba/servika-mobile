/** One line of Servika's price book (GET /api/v1/price-book). Prices are labour; `partsNote` says how parts are charged. */
export type PriceBookItem = {
  id: string;
  categorySlug: string;
  categoryName: string;
  kind: 'Fixed' | 'AddOn' | 'Custom';
  name: string;
  /** What the price covers, in one line. */
  scope: string;
  priceNaira: number | null;
  rangeMinNaira: number | null;
  rangeMaxNaira: number | null;
  partsNote: string | null;
  durationMinutes: number | null;
  /** API path of the cover photo, or null (the app draws its placeholder). */
  photoUrl: string | null;
  isPopular: boolean;
};

/** A category screen: its fixed jobs, the diagnosis visit fee and how many repairs a diagnosis covers. */
export type CategoryPriceBook = {
  categorySlug: string;
  categoryName: string;
  fixedJobs: PriceBookItem[];
  diagnosisFeeNaira: number;
  addOnCount: number;
};
