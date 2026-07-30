import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import MapView, {
  AnimatedRegion,
  Marker,
  MarkerAnimated,
  Polyline,
  PROVIDER_DEFAULT,
} from 'react-native-maps';

import { colors } from '@/constants/colors';
import { distanceKm, regionFor, type LatLng } from '@/lib/tracking/geo';

/** A nearby artisan to show as an ambient marker. */
export type NearbyMarker = { id: string; position: LatLng };

// Explicit role colours (not theme tokens) so the two apps render identically:
// the artisan is always orange, the customer always blue — like ride apps give
// driver and rider each a fixed identity colour.
const ARTISAN_COLOR = '#F97316';
const CUSTOMER_COLOR = '#2563EB';

/**
 * An inDrive-style person marker: a small coloured name tag floating above a
 * circular person icon. Starts with `tracksViewChanges` ON so Android rasterises
 * it AFTER the text/icon have drawn, then freezes ~600ms later — a frozen raster
 * moves smoothly with the marker at 60fps instead of re-drawing every frame
 * (the re-draw churn is what makes markers feel janky).
 */
function PersonBadge({
  label,
  color,
  icon,
}: {
  label?: string;
  color: string;
  icon: 'walk' | 'person';
}) {
  return (
    <View className="items-center">
      {label ? (
        <View
          className="mb-1 rounded-full px-2.5 py-[3px]"
          style={[{ backgroundColor: color }, shadow]}
        >
          <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
      <View
        className="h-9 w-9 items-center justify-center rounded-full border-2 border-white"
        style={[{ backgroundColor: color }, shadow]}
      >
        <Ionicons name={icon} size={16} color={colors.white} />
      </View>
    </View>
  );
}

/** Rasterise-then-freeze wrapper for static markers (destination). */
function FrozenMarker({
  coordinate,
  children,
  anchor,
}: {
  coordinate: LatLng;
  children: React.ReactNode;
  anchor?: { x: number; y: number };
}) {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <Marker coordinate={coordinate} anchor={anchor ?? { x: 0.5, y: 0.5 }} tracksViewChanges={tracks}>
      {children}
    </Marker>
  );
}

/**
 * The moving artisan marker. Glides between location pings with a tween whose
 * duration adapts to the real ping cadence (a 4s gap tweens over ~4s), so the
 * marker appears to move continuously instead of hop-and-wait.
 */
function ArtisanPuck({ position, label }: { position: LatLng; label?: string }) {
  const region = useRef(
    new AnimatedRegion({
      latitude: position.latitude,
      longitude: position.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;
  const first = useRef(true);
  const lastAt = useRef(Date.now());
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setTracks(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const next = {
      latitude: position.latitude,
      longitude: position.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    };
    const now = Date.now();
    if (first.current) {
      first.current = false;
      lastAt.current = now;
      region.setValue(next);
      return;
    }
    // Tween across (roughly) the time until the next ping arrives.
    const sincePrev = now - lastAt.current;
    lastAt.current = now;
    const duration = Math.min(6000, Math.max(800, sincePrev));
    // `toValue` is required by the (Animated) type but ignored by AnimatedRegion,
    // which tweens to the latitude/longitude provided here.
    region.timing({ ...next, toValue: 0, duration, useNativeDriver: false }).start();
  }, [position.latitude, position.longitude, region]);

  return (
    <MarkerAnimated
      coordinate={region}
      anchor={{ x: 0.5, y: label ? 0.72 : 0.5 }}
      tracksViewChanges={tracks}
    >
      <PersonBadge label={label} color={ARTISAN_COLOR} icon="walk" />
    </MarkerAnimated>
  );
}

/**
 * Sleek dark ride-app-style live map: person markers with coloured name tags
 * (artisan orange, customer blue), a road-snapped route line, a smoothly gliding
 * artisan puck, and a camera that follows the trip — panning by hand pauses the
 * follow; the recenter button resumes it.
 *
 * Real native map (react-native-maps): Apple Maps on iOS (no key), Google on
 * Android (needs a Maps key for release). Requires a dev build, not Expo Go.
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
  /** Road-snapped route to draw. `approximate` (stub provider) renders dashed. */
  route?: { points: LatLng[]; approximate: boolean } | null;
  /** Show the viewer's own blue dot — so a customer can walk to meet a
   * stationary artisan (needs foreground location permission). */
  showsUserLocation?: boolean;
  /** Name tag over the moving artisan marker (e.g. the artisan's first name, or
   * "You" on the artisan's own screen). */
  artisanLabel?: string;
  /** Name tag over the destination marker (e.g. "You" for the customer watching,
   * or the customer's name on the artisan's screen). */
  destinationLabel?: string;
}) {
  const mapRef = useRef<MapView | null>(null);
  // Camera follows the trip until the user pans; recenter resumes following.
  const follow = useRef(true);
  const lastFitAt = useRef<LatLng | null>(null);

  const fit = () => {
    const pts = [destination, ...(artisan ? [artisan] : [])];
    if (pts.length < 2) {
      mapRef.current?.animateToRegion(
        { ...destination, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
      return;
    }
    lastFitAt.current = artisan;
    mapRef.current?.fitToCoordinates(pts, {
      edgePadding: { top: 140, right: 90, bottom: 340, left: 90 },
      animated: true,
    });
  };

  // Re-frame when the artisan first appears or the destination changes.
  useEffect(() => {
    const t = setTimeout(fit, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.latitude, destination.longitude, !!artisan]);

  // Trip follow: as the artisan moves meaningfully (~60m), keep both ends framed
  // — unless the user has taken over by panning.
  useEffect(() => {
    if (!artisan || !follow.current) return;
    const prev = lastFitAt.current;
    if (!prev || distanceKm(prev, artisan) > 0.06) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artisan?.latitude, artisan?.longitude]);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        userInterfaceStyle="dark"
        customMapStyle={DARK_MAP_STYLE}
        showsCompass={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        toolbarEnabled={false}
        onPanDrag={() => {
          follow.current = false;
        }}
        initialRegion={regionFor(artisan ?? destination, destination)}
      >
        {/* Destination (the customer / job address) — blue person with name tag */}
        <FrozenMarker coordinate={destination} anchor={{ x: 0.5, y: destinationLabel ? 0.72 : 0.5 }}>
          <PersonBadge label={destinationLabel} color={CUSTOMER_COLOR} icon="person" />
        </FrozenMarker>

        {/* Ambient nearby artisans */}
        {nearby.map((n) => (
          <FrozenMarker key={n.id} coordinate={n.position}>
            <View
              className="h-6 w-6 items-center justify-center rounded-full border border-white"
              style={[{ backgroundColor: `${ARTISAN_COLOR}B3` }, shadow]}
            >
              <Ionicons name="construct" size={11} color={colors.white} />
            </View>
          </FrozenMarker>
        ))}

        {/* Route: road-snapped polyline when we have one (solid for real Google
            geometry, dashed when it's the straight-line stub); otherwise a dashed
            straight line between artisan and destination. */}
        {route && route.points.length >= 2 ? (
          <Polyline
            coordinates={route.points}
            strokeColor={ARTISAN_COLOR}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={route.approximate ? [1, 8] : undefined}
          />
        ) : artisan ? (
          <Polyline
            coordinates={[artisan, destination]}
            strokeColor={ARTISAN_COLOR}
            strokeWidth={4}
            lineDashPattern={[1, 8]}
            lineCap="round"
          />
        ) : null}

        {/* Live artisan puck (smoothly animated person marker with name tag) */}
        {artisan ? <ArtisanPuck position={artisan} label={artisanLabel} /> : null}
      </MapView>

      {/* Recenter: re-frames the trip and resumes camera follow. */}
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

// Compact sleek dark style (Google provider; ignored by Apple Maps, which uses
// userInterfaceStyle="dark"). Tuned for a calm Uber/Bolt-like night map.
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2330' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b93a7' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d2330' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3142' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#323a4d' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3b4356' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9aa3b7' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#11151c' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1d2330' }] },
];
