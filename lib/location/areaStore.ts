import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

import { resolveCurrentArea } from '@/lib/location/search';
import type { LatLng } from '@/lib/tracking/geo';

/**
 * The user's chosen service area: a tiny app-wide store so the map picker and
 * the location sheet can set it and Home reads it reactively. Carries a display
 * label and coordinates; the coords drive every "near you" distance.
 *
 * There is no fake default. On start we restore the last chosen area from the
 * device; failing that we try a silent GPS fix (only when location permission
 * was already granted, never a prompt). Until one of those works the area is
 * unset (empty label, null coords) and screens ask the user to set it.
 */

const STORAGE_KEY = 'servika.selectedArea.v1';

let currentArea = '';
let currentCoords: LatLng | null = null;
/** True once restore/GPS has finished, so screens can tell "unset" from "still loading". */
let resolved = false;
let initStarted = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function persist() {
  const payload = JSON.stringify({ label: currentArea, coords: currentCoords });
  SecureStore.setItemAsync(STORAGE_KEY, payload).catch(() => {
    /* best-effort: the area still works for this session */
  });
}

export function setSelectedArea(area: string, coords?: LatLng | null) {
  if (!area) return;
  currentArea = area;
  // Only overwrite coords when we actually resolved some (a label-only pick
  // keeps the previous coords rather than dropping to null).
  if (coords !== undefined) currentCoords = coords;
  resolved = true;
  persist();
  emit();
}

/**
 * Restore the saved area, else try a silent GPS fix. Safe to call many times;
 * only the first call does any work.
 */
export async function initSelectedArea(): Promise<void> {
  if (initStarted) return;
  initStarted = true;
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { label?: string; coords?: LatLng | null };
      if (saved.label && !currentArea) {
        currentArea = saved.label;
        currentCoords = saved.coords ?? null;
        resolved = true;
        emit();
        return;
      }
    }
  } catch {
    /* fall through to GPS */
  }
  try {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status === Location.PermissionStatus.GRANTED && !currentArea) {
      const here = await resolveCurrentArea();
      if (!currentArea) {
        setSelectedArea(here.label, { latitude: here.lat, longitude: here.lng });
        return;
      }
    }
  } catch {
    /* leave unset; the UI asks the user */
  }
  resolved = true;
  emit();
}

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};

/** The selected area's label, or '' when the user has not set one yet. */
export function useSelectedArea(): string {
  return useSyncExternalStore(subscribe, () => currentArea);
}

/** Coordinates of the selected area, or null if unknown. Stable reference. */
export function useSelectedCoords(): LatLng | null {
  return useSyncExternalStore(subscribe, () => currentCoords);
}

/** False while the saved area / silent GPS lookup is still running. */
export function useAreaResolved(): boolean {
  return useSyncExternalStore(subscribe, () => resolved);
}
