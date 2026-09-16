import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Camera, LibreMap, LineOverlay, Pin, UserLocation, boundsFor, toLngLat, zoomForSpan, type CameraRef } from '@/components/map/LibreMap';
import { colors } from '@/constants/colors';
import { distanceKm, type LatLng } from '@/lib/tracking/geo';

/** A nearby artisan to show as an ambient marker. */
export type NearbyMarker = { id: string; position: LatLng };

// Fixed identity colours so both apps render the same: artisan orange, customer blue.
const ARTISAN_COLOR = '#F97316';
const CUSTOMER_COLOR = '#2563EB';

/** An inDrive-style person marker: a coloured name tag above a round person icon. */
function PersonBadge({ label, color, icon }: { label?: string; color: string; icon: 'walk' | 'person' }) {
  return (
    <View className="items-center">
      {label ? (
        <View className="mb-1 rounded-full px-2.5 py-[3px]" style={[{ backgroundColor: color }, shadow]}>
          <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
      <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white" style={[{ backgroundColor: color }, shadow]}>
        <Ionicons name={icon} size={16} color={colors.white} />
      </View>
    </View>
  );
}

/**
 * Glides a position between pings: the marker moves continuously across the
 * gap until the next ping instead of hop-and-wait. Pure JS, ~30 fps.
 */
function useGlide(target: LatLng): LatLng {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const lastAt = useRef(Date.now());
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      lastAt.current = Date.now();
      setShown(target);
      return;
    }
    const start = from.current;
    const startedAt = Date.now();
    const duration = Math.min(6000, Math.max(800, startedAt - lastAt.current));
    lastAt.current = startedAt;
    let raf: ReturnType<typeof setTimeout>;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const e = 1 - (1 - t) * (1 - t);
      const next = {
        latitude: start.latitude + (target.latitude - start.latitude) * e,
        longitude: start.longitude + (target.longitude - start.longitude) * e,
      };
      from.current = next;
      setShown(next);
      if (t < 1) raf = setTimeout(tick, 33);
    };
    tick();
    return () => clearTimeout(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.latitude, target.longitude]);
  return shown;
}

function ArtisanPuck({ position, label }: { position: LatLng; label?: string }) {
  const shown = useGlide(position);
  return (
    <Pin position={shown} anchor={label ? 'bottom' : 'center'}>
      <PersonBadge label={label} color={ARTISAN_COLOR} icon="walk" />
    </Pin>
  );
}

/**
 * Ride-app-style live map: person markers with coloured name tags, a road-snapped
 * route line, a gliding artisan puck, and a camera that follows the trip. Panning
 * by hand pauses the follow; the recenter button resumes it. Free OpenStreetMap
 * tiles via MapLibre; needs a native build, not Expo Go.
 */
export function LiveMap({
  destination,
  artisan,
  nearby = [],
  route,
  showsUserLocation = false,
  artisanLabel,
  destinationLabel,
}: {
  destination: LatLng;
  artisan: LatLng | null;
  nearby?: NearbyMarker[];
  /** Road-snapped route to draw. `approximate` (straight-line stub) renders dashed. */
  route?: { points: LatLng[]; approximate: boolean } | null;
  /** Show the viewer's own blue dot (needs foreground location permission). */
  showsUserLocation?: boolean;
  /** Name tag over the moving artisan marker. */
  artisanLabel?: string;
  /** Name tag over the destination marker. */
  destinationLabel?: string;
}) {
  const camera = useRef<CameraRef | null>(null);
  const follow = useRef(true);
  const lastFitAt = useRef<LatLng | null>(null);

  const fit = () => {
    lastFitAt.current = artisan;
    // Close together, or no ping yet: a street-level camera you can read names on.
    if (!artisan || distanceKm(destination, artisan) < 0.35) {
      const center = artisan
        ? { latitude: (destination.latitude + artisan.latitude) / 2, longitude: (destination.longitude + artisan.longitude) / 2 }
        : destination;
      camera.current?.easeTo({ center: toLngLat(center), zoom: 16, duration: 500 });
      return;
    }
    const bounds = boundsFor([destination, artisan]);
    if (bounds) camera.current?.fitBounds(bounds, { padding: { top: 140, right: 90, bottom: 340, left: 90 }, duration: 600 });
  };

  useEffect(() => {
    const t = setTimeout(fit, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.latitude, destination.longitude, !!artisan]);

  // Follow the trip: re-frame every ~60 m unless the user has panned.
  useEffect(() => {
    if (!artisan || !follow.current) return;
    const prev = lastFitAt.current;
    if (!prev || distanceKm(prev, artisan) > 0.06) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artisan?.latitude, artisan?.longitude]);

  const initialSpan = artisan
    ? Math.max(Math.abs(destination.latitude - artisan.latitude) * 2.2, 0.01)
    : 0.01;

  return (
    <View className="flex-1">
      <LibreMap
        style={{ flex: 1 }}
        onRegionWillChange={(e) => {
          if (e.nativeEvent.userInteraction) follow.current = false;
        }}
      >
        <Camera
          ref={camera}
          initialViewState={{ center: toLngLat(artisan ?? destination), zoom: zoomForSpan(initialSpan) }}
        />
        {showsUserLocation ? <UserLocation /> : null}

        {route && route.points.length >= 2 ? (
          <LineOverlay id="route" points={route.points} color={ARTISAN_COLOR} width={5} dashed={route.approximate} />
        ) : artisan ? (
          <LineOverlay id="route" points={[artisan, destination]} color={ARTISAN_COLOR} width={4} dashed />
        ) : null}

        {nearby.map((n) => (
          <Pin key={n.id} position={n.position}>
            <View className="h-6 w-6 items-center justify-center rounded-full border border-white" style={[{ backgroundColor: `${ARTISAN_COLOR}B3` }, shadow]}>
              <Ionicons name="construct" size={11} color={colors.white} />
            </View>
          </Pin>
        ))}

        <Pin position={destination} anchor={destinationLabel ? 'bottom' : 'center'}>
          <PersonBadge label={destinationLabel} color={CUSTOMER_COLOR} icon="person" />
        </Pin>

        {artisan ? <ArtisanPuck position={artisan} label={artisanLabel} /> : null}
      </LibreMap>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recenter map"
        onPress={() => {
          follow.current = true;
          fit();
        }}
        className="absolute bottom-4 right-4 h-11 w-11 items-center justify-center rounded-full bg-white"
        style={shadow}
      >
        <Ionicons name="locate" size={20} color={ARTISAN_COLOR} />
      </Pressable>
    </View>
  );
}

const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.25,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 5,
} as const;
