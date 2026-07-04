import { useSyncExternalStore } from 'react';

import type { LatLng } from '@/lib/tracking/geo';

/**
 * The user's chosen service area — a tiny app-wide store so the map-picker
 * screen and the location sheet can set it and Home reads it reactively (no
 * prop-drilling across a navigation boundary). Carries both a display label and
 * coordinates; the coords drive location-aware "Nearby Artisans" (distance +
 * proximity sort). Local/in-memory only for now — persisting it lands with the
 * saved-addresses backend.
 */

// Default to Lekki so "Nearby" is location-aware from first launch.
let currentArea = 'Lekki, Lagos';
let currentCoords: LatLng | null = { latitude: 6.4478, longitude: 3.4723 };
const listeners = new Set<() => void>();

export function setSelectedArea(area: string, coords?: LatLng | null) {
  if (!area) return;
  currentArea = area;
  // Only overwrite coords when we actually resolved some (a label-only pick
  // keeps the previous coords rather than dropping to null).
  if (coords !== undefined) currentCoords = coords;
  listeners.forEach((l) => l());
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};

export function useSelectedArea(): string {
  return useSyncExternalStore(subscribe, () => currentArea);
}

/** Coordinates of the selected area, or null if unknown. Stable reference. */
export function useSelectedCoords(): LatLng | null {
  return useSyncExternalStore(subscribe, () => currentCoords);
}
