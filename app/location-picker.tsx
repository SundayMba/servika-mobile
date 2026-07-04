import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { setSelectedArea } from '@/lib/location/areaStore';
import {
  geocodeText,
  reverseGeocodeArea,
  searchPlaces,
  type PlaceResult,
} from '@/lib/location/search';

// Nigeria bounding box — the map is locked to this so you can only pan/zoom
// within the country (states + LGAs are all reachable, nothing wanders off to
// another continent).
const NG_BOUNDS = {
  northEast: { latitude: 13.9, longitude: 14.7 },
  southWest: { latitude: 4.2, longitude: 2.6 },
};

/** Is a coordinate inside Nigeria? (guards a simulator's out-of-country GPS). */
function inNigeria(latitude: number, longitude: number): boolean {
  return (
    latitude >= NG_BOUNDS.southWest.latitude &&
    latitude <= NG_BOUNDS.northEast.latitude &&
    longitude >= NG_BOUNDS.southWest.longitude &&
    longitude <= NG_BOUNDS.northEast.longitude
  );
}

// Default framing: greater Lagos (the launch city) at a zoom where neighbourhood
// / LGA labels (Lekki, Agege, Ikeja, Yaba…) are visible, so the user can find and
// tap a place right away. Still bounded to Nigeria (below) so they can pan to
// other states; GPS/search jump elsewhere. Whole-country view was too zoomed-out
// to label neighbourhoods.
const DEFAULT_REGION_DELTAS = { latitudeDelta: 0.22, longitudeDelta: 0.18 };
const DEFAULT_REGION: Region = {
  latitude: 6.5244,
  longitude: 3.3792,
  ...DEFAULT_REGION_DELTAS,
};

// A comfortable zoom once we jump to a specific point (GPS / search result).
const FOCUS_DELTA = { latitudeDelta: 0.012, longitudeDelta: 0.012 };

// Widest zoom we allow before snapping back to a city view — keeps the map from
// zooming out to a continental "Nigeria / Ghana / Mali" scale.
const MAX_DELTA = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Full-screen map location picker with a fixed centre pin — pan the map to move
 * the pin (Uber/Bolt style). The pin lifts + casts a growing shadow while the
 * map moves, then drops and reverse-geocodes the centre on settle. Search
 * (Google Places) recentres the map; a locate button jumps to current GPS.
 */
export default function LocationPicker() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const center = useRef<{ latitude: number; longitude: number }>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });

  const [address, setAddress] = useState('Move the map to pick a spot');
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  // Pin lift animation (0 = grounded, 1 = lifted while the map moves).
  const lift = useSharedValue(0);
  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -22 - lift.value * 10 }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.28 - lift.value * 0.14,
    transform: [{ scaleX: 1 - lift.value * 0.35 }, { scaleY: 1 - lift.value * 0.35 }],
  }));

  // Reverse-geocode the current centre and show it in the bottom card.
  const resolveCenter = useCallback(async () => {
    setResolving(true);
    const { latitude, longitude } = center.current;
    const label = await reverseGeocodeArea(latitude, longitude);
    setAddress(label);
    setResolving(false);
  }, []);

  // Initial fill: silently use GPS if already permitted AND inside Nigeria;
  // otherwise keep the country-wide view and wait for the user to pan/search.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const { latitude, longitude } = pos.coords;
        if (!inNigeria(latitude, longitude)) return;
        center.current = { latitude, longitude };
        mapRef.current?.animateToRegion({ latitude, longitude, ...FOCUS_DELTA }, 600);
        resolveCenter();
      } catch {
        // ignore — the country-wide default region stands
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolveCenter]);

  // Debounced Places search.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setResults(await searchPlaces(q, controller.signal));
      } catch {
        setResults([]);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const onRegionChange = () => {
    lift.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
  };

  const onRegionChangeComplete = (region: Region) => {
    lift.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.back(2)) });

    // Keep the map inside Nigeria (pure JS — no flaky native boundary/zoom APIs):
    // clamp the centre to the country box, and if it's zoomed out past the
    // country (into a continental view), pull it back to a city-level zoom.
    const lat = clamp(region.latitude, NG_BOUNDS.southWest.latitude, NG_BOUNDS.northEast.latitude);
    const lng = clamp(region.longitude, NG_BOUNDS.southWest.longitude, NG_BOUNDS.northEast.longitude);
    const tooWide = region.latitudeDelta > MAX_DELTA;

    if (lat !== region.latitude || lng !== region.longitude || tooWide) {
      const next = tooWide
        ? { latitude: lat, longitude: lng, ...DEFAULT_REGION_DELTAS }
        : { latitude: lat, longitude: lng, latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta };
      center.current = { latitude: lat, longitude: lng };
      mapRef.current?.animateToRegion(next, 250);
      return; // the follow-up onRegionChangeComplete resolves the address
    }

    center.current = { latitude: region.latitude, longitude: region.longitude };
    resolveCenter();
  };

  const pickSearchResult = async (r: PlaceResult) => {
    Keyboard.dismiss();
    setSearchFocused(false);
    setQuery('');
    setResults([]);
    const label = r.sub ? `${r.label}, ${r.sub}` : r.label;
    setAddress(label);
    setResolving(true);
    const coords = await geocodeText(label);
    setResolving(false);
    if (coords && inNigeria(coords.latitude, coords.longitude)) {
      center.current = coords;
      mapRef.current?.animateToRegion({ ...coords, ...FOCUS_DELTA }, 500);
    }
  };

  const goToCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      if (!inNigeria(latitude, longitude)) {
        Alert.alert(
          'Outside Nigeria',
          "Your current location isn't in Nigeria. Search or drag the map to pick a spot.",
        );
        return;
      }
      center.current = { latitude, longitude };
      mapRef.current?.animateToRegion({ latitude, longitude, ...FOCUS_DELTA }, 600);
    } catch {
      // ignore
    } finally {
      setLocating(false);
    }
  };

  const confirm = () => {
    if (resolving || address.startsWith('Move the map')) return;
    setSelectedArea(address, {
      latitude: center.current.latitude,
      longitude: center.current.longitude,
    });
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={DEFAULT_REGION}
        showsPointsOfInterest={false}
        showsCompass={false}
        toolbarEnabled={false}
        showsMyLocationButton={false}
        onRegionChange={onRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
      />

      {/* Fixed centre pin (overlay — the map pans beneath it) */}
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
      >
        <View className="items-center">
          <Animated.View style={pinStyle}>
            <Ionicons name="location" size={46} color={colors.primary} />
          </Animated.View>
          {/* ground shadow that shrinks as the pin lifts */}
          <Animated.View
            style={[
              {
                width: 16,
                height: 6,
                borderRadius: 8,
                backgroundColor: '#0F172A',
                marginTop: -6,
              },
              shadowStyle,
            ]}
          />
        </View>
      </View>

      {/* ── Top: back + search ── */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="absolute inset-x-0 top-0 px-4"
      >
        <View className="flex-row items-center gap-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-2xl bg-white"
            style={shadow}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>

          <View
            className="h-12 flex-1 flex-row items-center gap-2.5 rounded-2xl bg-white px-3.5"
            style={shadow}
          >
            <Ionicons name="search-outline" size={19} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search area, street, landmark…"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              autoCorrect={false}
              className="flex-1 text-[14px] text-gray-900"
            />
            {query.length > 0 ? (
              <Pressable hitSlop={8} onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Search results dropdown */}
        {searchFocused && results.length > 0 ? (
          <Animated.View
            entering={FadeIn.duration(150)}
            className="mt-2 overflow-hidden rounded-2xl bg-white"
            style={shadow}
          >
            {results.slice(0, 6).map((r, i) => (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                onPress={() => pickSearchResult(r)}
                className={`flex-row items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <Ionicons
                  name="location-outline"
                  size={17}
                  color={colors.textMuted}
                />
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-[14px] font-medium text-gray-800"
                  >
                    {r.label}
                  </Text>
                  {r.sub ? (
                    <Text numberOfLines={1} className="text-[12px] text-gray-400">
                      {r.sub}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </Animated.View>
        ) : null}
      </View>

      {/* ── Locate FAB (sits just above the bottom card) ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to my current location"
        onPress={goToCurrentLocation}
        disabled={locating}
        className="absolute right-4 h-12 w-12 items-center justify-center rounded-full bg-white"
        style={[shadow, { bottom: insets.bottom + 180 }]}
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="locate" size={22} color={colors.primary} />
        )}
      </Pressable>

      {/* ── Bottom confirmation card ── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{ paddingBottom: insets.bottom + 16 }}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pt-5"
      >
        <Text className="mb-2 text-[12px] font-semibold text-gray-400">
          SELECTED LOCATION
        </Text>
        <View className="mb-4 flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: '#FFEDD5' }}
          >
            <Ionicons name="location" size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            {resolving ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-[14px] text-gray-400">Locating…</Text>
              </View>
            ) : (
              <Text className="text-[15px] font-semibold text-gray-900">
                {address}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Confirm this location"
          onPress={confirm}
          disabled={resolving}
          className="h-14 flex-row items-center justify-center gap-2 rounded-2xl"
          style={{ backgroundColor: resolving ? '#E2E6ED' : colors.primary }}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={resolving ? colors.textMuted : '#FFFFFF'}
          />
          <Text
            className="text-[15px] font-bold"
            style={{ color: resolving ? colors.textMuted : '#FFFFFF' }}
          >
            Confirm location
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
} as const;
