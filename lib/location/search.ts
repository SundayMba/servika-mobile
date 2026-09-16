import * as Location from 'expo-location';

import type { LatLng } from '@/lib/tracking/geo';

/**
 * Location search + current-location resolution for the service-area picker.
 *
 * Backends in order, same shape:
 *  - **Google Places Autocomplete** when `EXPO_PUBLIC_GOOGLE_PLACES_KEY` is set.
 *  - **LocationIQ** (OpenStreetMap, free tier, no card) when `EXPO_PUBLIC_LOCATIONIQ_KEY` is set.
 *  - **Photon** (komoot's OpenStreetMap geocoder, no key) otherwise.
 *  - **Native geocoding** (expo-location) as the last resort.
 *
 * The picker only needs a human label to show on Home, so autocomplete results
 * carry no coordinates (a Place Details lookup would add a billable call). GPS
 * "use my location" does reverse-geocode to a readable area.
 */

export type PlaceResult = {
  id: string;
  /** Primary line, e.g. "Lekki Phase 1". */
  label: string;
  /** Secondary line, e.g. "Lagos, Nigeria". */
  sub?: string;
};

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

/** True when real Google Places autocomplete is available. */
export const hasPlacesKey = !!PLACES_KEY;

/**
 * Google Places Autocomplete (New) — Nigeria-scoped type-ahead.
 * Recent Google Cloud projects can only enable "Places API (New)", so this is
 * the primary endpoint. Returns `null` on an API error (key not enabled /
 * restricted / quota) so the caller can fall back — `[]` means a real
 * "no matches" and should NOT cascade.
 */
async function searchGooglePlacesNew(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[] | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_KEY!,
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ['ng'],
      languageCode: 'en',
    }),
  });
  const json = (await res.json()) as {
    error?: { message?: string };
    suggestions?: {
      placePrediction?: {
        placeId: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }[];
  };
  if (!res.ok || json.error) {
    if (__DEV__)
      console.warn('[places-new] error:', json.error?.message ?? res.status);
    return null;
  }
  return (json.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      id: p.placeId,
      label: p.structuredFormat?.mainText?.text ?? p.text?.text ?? query,
      sub: p.structuredFormat?.secondaryText?.text,
    }));
}

/** Legacy Places Autocomplete — kept as a fallback for keys/projects that
 *  still have the old "Places API" enabled instead of the new one. */
async function searchGooglePlacesLegacy(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[] | null> {
  const url =
    'https://maps.googleapis.com/maps/api/place/autocomplete/json' +
    `?input=${encodeURIComponent(query)}` +
    `&key=${PLACES_KEY}&components=country:ng&language=en`;
  const res = await fetch(url, { signal });
  const json = (await res.json()) as {
    status: string;
    error_message?: string;
    predictions?: {
      place_id: string;
      description: string;
      structured_formatting?: { main_text: string; secondary_text?: string };
    }[];
  };
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    if (__DEV__)
      console.warn('[places-legacy] error:', json.status, json.error_message ?? '');
    return null;
  }
  return (json.predictions ?? []).map((p) => ({
    id: p.place_id,
    label: p.structured_formatting?.main_text ?? p.description,
    sub: p.structured_formatting?.secondary_text,
  }));
}

const LOCATIONIQ_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;

/**
 * LocationIQ autocomplete (OpenStreetMap data, Nigeria-scoped). Free tier with no
 * card: set EXPO_PUBLIC_LOCATIONIQ_KEY. `null` on an API error so the caller
 * falls through; `[]` is a real "no matches".
 */
async function searchLocationIq(query: string, signal?: AbortSignal): Promise<PlaceResult[] | null> {
  try {
    const url =
      'https://api.locationiq.com/v1/autocomplete' +
      `?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(query)}&countrycodes=ng&limit=6&normalizecity=1&dedupe=1`;
    const res = await fetch(url, { signal });
    if (res.status === 404) return [];
    if (!res.ok) return null;
    const json = (await res.json()) as { place_id: string; display_place?: string; display_address?: string; display_name: string }[];
    return json.map((p) => ({
      id: String(p.place_id),
      label: p.display_place ?? p.display_name.split(',')[0],
      sub: p.display_address ?? p.display_name.split(',').slice(1, 3).join(',').trim() ?? undefined,
    }));
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    return null;
  }
}

/**
 * Photon (komoot's OpenStreetMap geocoder): no key, fair-use public instance.
 * Biased to Lagos, filtered to Nigeria. `null` on an API error, `[]` on no matches.
 */
async function searchPhoton(query: string, signal?: AbortSignal): Promise<PlaceResult[] | null> {
  try {
    const url =
      'https://photon.komoot.io/api/' +
      `?q=${encodeURIComponent(query)}&limit=8&lang=en&lat=6.5244&lon=3.3792&zoom=10&location_bias_scale=0.4`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      features?: { properties: { osm_id: number; name?: string; street?: string; housenumber?: string; district?: string; city?: string; county?: string; state?: string; countrycode?: string } }[];
    };
    const out: PlaceResult[] = [];
    for (const f of json.features ?? []) {
      const pr = f.properties;
      if (pr.countrycode && pr.countrycode.toUpperCase() !== 'NG') continue;
      const label = pr.name ?? [pr.housenumber, pr.street].filter(Boolean).join(' ');
      if (!label) continue;
      const sub = [pr.district, pr.city ?? pr.county, pr.state].filter((x) => x && x !== label).join(', ');
      out.push({ id: `photon-${pr.osm_id}-${out.length}`, label, sub: sub || undefined });
      if (out.length >= 6) break;
    }
    return out;
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    return null;
  }
}

/** Fallback: resolve a typed address to a place via the native geocoder. */
async function searchNativeGeocode(query: string): Promise<PlaceResult[]> {
  try {
    const matches = await Location.geocodeAsync(query);
    const top = matches.slice(0, 4);
    const results = await Promise.all(
      top.map(async (m, i) => {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: m.latitude,
          longitude: m.longitude,
        });
        const label =
          [place?.name, place?.street].filter(Boolean).join(', ') ||
          place?.district ||
          place?.city ||
          query;
        const sub = [place?.city, place?.region, place?.country]
          .filter(Boolean)
          .join(', ');
        return { id: `${label}-${i}`, label, sub: sub || undefined };
      }),
    );
    return results;
  } catch {
    return [];
  }
}

/** Search for a location by text. Empty query → no results. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (PLACES_KEY) {
    // New API first, legacy second; only an API *error* (null) falls through —
    // a legitimate empty result stays empty. Last resort: native geocoder.
    const fresh = await searchGooglePlacesNew(q, signal);
    if (fresh) return fresh;
    const legacy = await searchGooglePlacesLegacy(q, signal);
    if (legacy) return legacy;
  }
  // OpenStreetMap-backed providers: LocationIQ when keyed, else Photon (no key).
  if (LOCATIONIQ_KEY) {
    const liq = await searchLocationIq(q, signal);
    if (liq) return liq;
  }
  const photon = await searchPhoton(q, signal);
  if (photon && photon.length > 0) return photon;
  return searchNativeGeocode(q);
}

/** Photon reverse geocode: a readable area for a coordinate, or null. */
async function reversePhoton(latitude: number, longitude: number): Promise<string | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${latitude}&lon=${longitude}&lang=en`);
    if (!res.ok) return null;
    const json = (await res.json()) as { features?: { properties: { name?: string; street?: string; district?: string; city?: string; county?: string; state?: string } }[] };
    const pr = json.features?.[0]?.properties;
    if (!pr) return null;
    const parts = [pr.name ?? pr.street, pr.district, pr.city ?? pr.county ?? pr.state].filter(Boolean);
    const uniq = parts.filter((x, i) => parts.indexOf(x) === i);
    return uniq.slice(0, 3).join(', ') || null;
  } catch {
    return null;
  }
}

/** Build a readable area label from a reverse-geocoded place. */
function formatPlace(place: Location.LocationGeocodedAddress | undefined): string | null {
  if (!place) return null;
  // Drop a bare house-number `name` (e.g. "12"); keep street/area/city, deduped.
  const name = place.name && /\d/.test(place.name) && place.street ? null : place.name;
  const parts = [name, place.street, place.district, place.city || place.region]
    .filter((p): p is string => !!p)
    .filter((p, i, arr) => arr.indexOf(p) === i);
  return parts.slice(0, 4).join(', ') || null;
}

/**
 * What a pin is called when no place name can be found for it. Never a bare
 * coordinate: "6.4785, 3.4219" is not an area anyone recognises, and it used to
 * leak into profiles and the Home header when geocoding failed.
 */
export const PINNED_LABEL = 'Pinned location';

/** True for labels that are really just numbers ("6.4785, 3.4219"). */
export function isCoordinateLabel(label: string | null | undefined): boolean {
  return !!label && /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(label.trim());
}

/** Reverse-geocode a coordinate to a readable service-area label. */
export async function reverseGeocodeArea(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const native = formatPlace(place);
    if (native) return native;
  } catch {
    /* fall through to Photon */
  }
  return (await reversePhoton(latitude, longitude)) ?? PINNED_LABEL;
}

/** Forward-geocode a text place to coordinates (for centering the map). */
export async function geocodeText(text: string): Promise<LatLng | null> {
  try {
    const [match] = await Location.geocodeAsync(text);
    return match
      ? { latitude: match.latitude, longitude: match.longitude }
      : null;
  } catch {
    return null;
  }
}

export type CurrentArea = { label: string; lat: number; lng: number };

/**
 * Get the device's current position and reverse-geocode it to a short,
 * readable service-area label (district + city). Throws with a friendly
 * message on denied permission or lookup failure.
 */
export async function resolveCurrentArea(): Promise<CurrentArea> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Location permission denied.');
  }
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;
  let label = '';
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    label = place
      ? [place.district || place.name || place.street, place.city || place.region].filter(Boolean).join(', ')
      : '';
  } catch {
    /* fall through to Photon */
  }
  if (!label) label = (await reversePhoton(latitude, longitude)) ?? '';
  return { label: label || PINNED_LABEL, lat: latitude, lng: longitude };
}
