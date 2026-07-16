import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import MapView, {
  AnimatedRegion,
  Marker,
  MarkerAnimated,
  Polyline,
  PROVIDER_DEFAULT,
} from 'react-native-maps';

import { colors } from '@/constants/colors';
import { regionFor, type LatLng } from '@/lib/tracking/geo';

/** A nearby artisan to show as an ambient marker. */
export type NearbyMarker = { id: string; position: LatLng };

/**
 * The moving artisan marker — a human "puck" (many artisans walk/ride) that glides
 * smoothly between location pings instead of jumping. Each new position is
 * tweened over ~1s via an AnimatedRegion; the first fix snaps into place.
 */
function ArtisanPuck({ position }: { position: LatLng }) {
  const region = useRef(
    new AnimatedRegion({
      latitude: position.latitude,
      longitude: position.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;
  const first = useRef(true);

  useEffect(() => {
    const next = {
      latitude: position.latitude,
      longitude: position.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    };
    if (first.current) {
      first.current = false;
      region.setValue(next);
      return;
    }
    // `toValue` is required by the (Animated) type but ignored by AnimatedRegion,
    // which tweens to the latitude/longitude provided here.
    region.timing({ ...next, toValue: 0, duration: 1000, useNativeDriver: false }).start();
  }, [position.latitude, position.longitude, region]);

  return (
    <MarkerAnimated coordinate={region} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
      <View className="items-center justify-center">
        {/* soft halo */}
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/20">
          {/* human puck */}
          <View
            className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary"
            style={shadow}
          >
            <Ionicons name="walk" size={16} color={colors.white} />
          </View>
        </View>
      </View>
    </MarkerAnimated>
  );
}

/**
 * Sleek dark Uber/Bolt-style live map. Renders the customer's destination, the
 * live artisan "puck" (rotated to its heading), ambient nearby-artisan dots, and
 * a straight route line between artisan and destination. Auto-frames both points
 * once and on demand via the recenter button.
 *
 * Real native map (react-native-maps): Apple Maps on iOS (no key), Google on
 * Android (needs a Maps key for release). Road-snapped routing needs a Directions
 * API — the straight polyline is a stand-in. Requires a dev build, not Expo Go.
 */
export function LiveMap({
  destination,
  artisan,
  nearby = [],
  route,
  showsUserLocation = false,
}: {
  destination: LatLng;
  artisan: LatLng | null;
  nearby?: NearbyMarker[];
  /** Road-snapped route to draw. `approximate` (stub provider) renders dashed. */
  route?: { points: LatLng[]; approximate: boolean } | null;
  /** Show the viewer's own blue dot — so a customer can walk to meet a
   * stationary artisan (needs foreground location permission). */
  showsUserLocation?: boolean;
}) {
  const mapRef = useRef<MapView | null>(null);

  const fit = () => {
    const pts = [destination, ...(artisan ? [artisan] : [])];
    if (pts.length < 2) {
      mapRef.current?.animateToRegion({ ...destination, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500);
      return;
    }
    mapRef.current?.fitToCoordinates(pts, {
      edgePadding: { top: 120, right: 80, bottom: 320, left: 80 },
      animated: true,
    });
  };

  // Re-frame when the artisan first appears or the destination changes.
  useEffect(() => {
    const t = setTimeout(fit, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.latitude, destination.longitude, !!artisan]);

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
        initialRegion={regionFor(artisan ?? destination, destination)}
      >
        {/* Destination (the customer / job address) */}
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
          <View className="items-center">
            <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#0F172A]" style={shadow}>
              <Ionicons name="location" size={18} color={colors.primaryLight} />
            </View>
          </View>
        </Marker>

        {/* Ambient nearby artisans */}
        {nearby.map((n) => (
          <Marker key={n.id} coordinate={n.position} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View className="h-6 w-6 items-center justify-center rounded-full border border-white bg-primary/70" style={shadow}>
              <Ionicons name="construct" size={11} color={colors.white} />
            </View>
          </Marker>
        ))}

        {/* Route: road-snapped polyline when we have one (solid for real Google
            geometry, dashed when it's the straight-line stub); otherwise a dashed
            straight line between artisan and destination. */}
        {route && route.points.length >= 2 ? (
          <Polyline
            coordinates={route.points}
            strokeColor={colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={route.approximate ? [1, 8] : undefined}
          />
        ) : artisan ? (
          <Polyline
            coordinates={[artisan, destination]}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[1, 8]}
            lineCap="round"
          />
        ) : null}

        {/* Live artisan puck (smoothly animated, human icon) */}
        {artisan ? <ArtisanPuck position={artisan} /> : null}
      </MapView>

      {/* Recenter */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Recenter map"
        onPress={fit}
        className="absolute bottom-4 right-4 h-11 w-11 items-center justify-center rounded-full bg-white"
        style={shadow}
      >
        <Ionicons name="locate" size={20} color={colors.primary} />
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
