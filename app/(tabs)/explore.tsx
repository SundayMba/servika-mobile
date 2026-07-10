import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchSheet } from '@/components/SearchSheet';
import { LocationSheet } from '@/components/home/LocationSheet';
import { colors } from '@/constants/colors';
import { artisanAvatar } from '@/lib/catalogue/assets';
import { useCategories, useExploreArtisans } from '@/lib/catalogue/hooks';
import type { ArtisanSummary } from '@/lib/catalogue/types';
import {
  setSelectedArea,
  useSelectedArea,
  useSelectedCoords,
} from '@/lib/location/areaStore';
import { resolveCurrentArea } from '@/lib/location/search';
import { etaMinutes, formatDistance, type LatLng } from '@/lib/tracking/geo';

/**
 * Explore — the Uber/Bolt-style discovery map (the app's raised center tab).
 * A full-screen map centered on the customer's area shows every nearby artisan
 * as an avatar pin; a draggable bottom sheet lists them by distance. Tapping a
 * pin selects the artisan (floating profile card), tapping a row opens the
 * full profile. Works anywhere in Nigeria — the area comes from GPS, search, or
 * the map picker; proximity is computed server-side from real coordinates.
 *
 * Needs a dev build (react-native-maps isn't in Expo Go), same as live tracking.
 */

// Height of the custom bottom tab bar (excluding the safe-area inset).
const TAB_BAR_HEIGHT = 60;

const { height: WINDOW_H } = Dimensions.get('window');

/** Region framing a district comfortably (~4–5 km across). */
const AREA_DELTA = 0.045;

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Uber-style teardrop map pin — an orange bubble with a house icon (where the
 * artisan is based) and an availability dot, with a pointed tail on the spot.
 *
 * Android quirk: with `tracksViewChanges={false}` from birth, the marker can
 * rasterise before the icon glyph has drawn, leaving an invisible pin. So it
 * starts tracking, then freezes shortly after mount (the selection remount —
 * via the parent's `key` — restarts the cycle so the new look renders too).
 */
function ArtisanPin({
  artisan,
  selected,
  onPress,
}: {
  artisan: ArtisanSummary;
  selected: boolean;
  onPress: () => void;
}) {
  const [track, setTrack] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTrack(false), 500);
    return () => clearTimeout(t);
  }, []);

  const size = selected ? 46 : 38;
  return (
    <Marker
      coordinate={{
        latitude: artisan.latitude!,
        longitude: artisan.longitude!,
      }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={track}
      onPress={onPress}
      zIndex={selected ? 10 : 1}
    >
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            height: size,
            width: size,
            borderRadius: 999,
            borderWidth: selected ? 3 : 2.5,
            borderColor: colors.white,
            backgroundColor: selected ? '#0F172A' : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...pinShadow,
          }}
        >
          <Ionicons name="home" size={selected ? 20 : 17} color={colors.white} />
          {/* Availability dot */}
          <View
            style={{
              position: 'absolute',
              right: -2,
              top: -2,
              height: 13,
              width: 13,
              borderRadius: 999,
              borderWidth: 2,
              borderColor: colors.white,
              backgroundColor: artisan.isAvailable ? '#22C55E' : '#D1D5DB',
            }}
          />
        </View>
        {/* Teardrop tail pointing at the exact spot */}
        <View
          style={{
            width: 0,
            height: 0,
            marginTop: -1,
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderTopWidth: 9,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: selected ? '#0F172A' : colors.primary,
          }}
        />
      </View>
    </Marker>
  );
}

function ArtisanRow({
  artisan,
  onPress,
  onLocate,
}: {
  artisan: ArtisanSummary;
  onPress: () => void;
  /** Centre the map on this artisan's pin (only offered when they have one). */
  onLocate?: () => void;
}) {
  const avatar = artisanAvatar(artisan.imageKey);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${artisan.fullName}, ${artisan.specialty}, ${formatDistance(artisan.distanceKm)} away`}
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-gray-100 bg-white px-5 py-3.5 active:bg-gray-50"
    >
      <View>
        <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary">
          {avatar ? (
            <Image source={avatar} style={{ height: '100%', width: '100%' }} />
          ) : (
            <Text className="text-[15px] font-bold text-white">
              {initials(artisan.fullName)}
            </Text>
          )}
        </View>
        <View
          className={
            artisan.isAvailable
              ? 'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500'
              : 'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-gray-300'
          }
        />
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text numberOfLines={1} className="flex-shrink text-[15px] font-semibold text-gray-900">
            {artisan.fullName}
          </Text>
          <MaterialCommunityIcons name="check-decagram" size={14} color="#3B82F6" />
        </View>
        <Text numberOfLines={1} className="mt-0.5 text-[12px] font-medium text-primary">
          {artisan.specialty}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text className="-ml-1 text-[12px] font-semibold text-gray-700">
            {artisan.rating.toFixed(1)}
          </Text>
          <Text className="text-[12px] text-gray-400">
            ({artisan.reviewCount})
          </Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="text-[13px] font-bold text-gray-900">
          {formatDistance(artisan.distanceKm)}
        </Text>
        <Text className="mt-0.5 text-[11px] text-gray-400">
          ~{etaMinutes(artisan.distanceKm)} min away
        </Text>
        {onLocate ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show ${artisan.fullName} on the map`}
            onPress={onLocate}
            hitSlop={8}
            className="mt-1 flex-row items-center gap-0.5"
          >
            <Ionicons name="location" size={11} color={colors.primary} />
            <Text className="text-[11px] font-semibold text-primary">Map</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Explore() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);

  const area = useSelectedArea();
  const coords = useSelectedCoords();

  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationVisible, setLocationVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [locating, setLocating] = useState(false);

  const { data: categories } = useCategories();
  const { data: artisans, isLoading, isError } = useExploreArtisans(category, coords);

  const pinned = useMemo(
    () => (artisans ?? []).filter((a) => a.latitude != null && a.longitude != null),
    [artisans],
  );
  const selected = pinned.find((a) => a.id === selectedId) ?? null;

  // ── Bottom sheet (two snap points: peek above the tab bar / expanded) ──
  const tabSpace = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12);
  const peekHeight = tabSpace + 168;
  const fullHeight = Math.min(WINDOW_H * 0.66, 620);
  const CLOSED_Y = fullHeight - peekHeight;
  const OPEN_Y = 0;

  const translateY = useRef(new Animated.Value(CLOSED_Y)).current;
  const snapRef = useRef<'open' | 'closed'>('closed');

  const snapTo = (target: 'open' | 'closed') => {
    snapRef.current = target;
    Animated.spring(translateY, {
      toValue: target === 'open' ? OPEN_Y : CLOSED_Y,
      useNativeDriver: true,
      damping: 22,
      stiffness: 220,
      mass: 0.7,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_, g) => {
        const start = snapRef.current === 'open' ? OPEN_Y : CLOSED_Y;
        const next = Math.min(Math.max(start + g.dy, OPEN_Y), CLOSED_Y);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const start = snapRef.current === 'open' ? OPEN_Y : CLOSED_Y;
        const endY = start + g.dy;
        const open = g.vy < -0.4 || (g.vy <= 0.4 && endY < (OPEN_Y + CLOSED_Y) / 2);
        snapTo(open ? 'open' : 'closed');
      },
    }),
  ).current;

  // ── Map follows the selected area (GPS, search, quick-pick, map picker) ──
  const centerOn = (target: LatLng, delta = AREA_DELTA) => {
    mapRef.current?.animateToRegion(
      { ...target, latitudeDelta: delta, longitudeDelta: delta },
      450,
    );
  };

  useEffect(() => {
    if (coords) centerOn(coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.latitude, coords?.longitude]);

  // First open: if location permission is already granted, quietly snap the
  // area to the device's real position — so the map works in any state of
  // Nigeria without a manual pick. (No prompt here; the locate button asks.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) return;
        const current = await resolveCurrentArea();
        if (!cancelled) {
          setSelectedArea(current.label, {
            latitude: current.lat,
            longitude: current.lng,
          });
        }
      } catch {
        // Best-effort — keep the previously selected area.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const locateMe = async () => {
    setLocating(true);
    try {
      const current = await resolveCurrentArea();
      setSelectedArea(current.label, {
        latitude: current.lat,
        longitude: current.lng,
      });
    } catch {
      // Permission denied / GPS unavailable — the area pill still works.
    } finally {
      setLocating(false);
    }
  };

  const selectArtisan = (artisan: ArtisanSummary) => {
    setSelectedId(artisan.id);
    if (artisan.latitude != null && artisan.longitude != null) {
      const pin = { latitude: artisan.latitude, longitude: artisan.longitude };
      if (coords) {
        // Frame the client and the artisan together so the connector line
        // (and the gap it spans) is visible in one glance.
        mapRef.current?.fitToCoordinates([coords, pin], {
          edgePadding: { top: 140, right: 60, bottom: 120, left: 60 },
          animated: true,
        });
      } else {
        centerOn(pin, 0.02);
      }
    }
    snapTo('closed');
  };

  const openProfile = (id: string) =>
    router.push({ pathname: '/artisan/[id]', params: { id } });

  const count = artisans?.length ?? 0;
  const initialRegion = {
    latitude: coords?.latitude ?? 6.4478,
    longitude: coords?.longitude ?? 3.4723,
    latitudeDelta: AREA_DELTA,
    longitudeDelta: AREA_DELTA,
  };

  return (
    <View className="flex-1 bg-background">
      {/* ── Map ── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        customMapStyle={LIGHT_MAP_STYLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        toolbarEnabled={false}
        onPress={() => setSelectedId(null)}
        mapPadding={{ top: 0, right: 0, bottom: peekHeight - tabSpace, left: 0 }}
      >
        {/* Dashed as-the-crow-flies connector between the client and the
            selected artisan — an honest "how far are they from me" hint. The
            real road-snapped route stays on the live-tracking screen. */}
        {selected && coords && selected.latitude != null && selected.longitude != null ? (
          <Polyline
            coordinates={[
              coords,
              { latitude: selected.latitude, longitude: selected.longitude },
            ]}
            strokeColor={colors.primary}
            strokeWidth={3}
            lineDashPattern={[1, 8]}
            lineCap="round"
          />
        ) : null}

        {pinned.map((a) => (
          <ArtisanPin
            // Selection changes size/ring — remount so the rasterised marker updates.
            key={`${a.id}-${a.id === selectedId ? 'sel' : 'idle'}`}
            artisan={a}
            selected={a.id === selectedId}
            onPress={() => selectArtisan(a)}
          />
        ))}
      </MapView>

      {/* ── Top overlay: area pill + search ── */}
      <View
        style={{ paddingTop: insets.top + 8 }}
        className="absolute inset-x-0 top-0 px-4"
      >
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Service area: ${area}. Change area`}
            onPress={() => setLocationVisible(true)}
            style={overlayShadow}
            className="h-12 flex-1 flex-row items-center gap-2 rounded-full bg-white pl-4 pr-3"
          >
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text numberOfLines={1} className="flex-1 text-[14px] font-semibold text-gray-900">
              {area}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search services"
            onPress={() => setSearchVisible(true)}
            style={overlayShadow}
            className="h-12 w-12 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="search" size={19} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          <Chip
            label="All"
            active={category === null}
            onPress={() => setCategory(null)}
          />
          {(categories ?? []).map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              active={category === c.slug}
              onPress={() => setCategory(category === c.slug ? null : c.slug)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Locate-me, floating above the sheet ── */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use my current location"
        onPress={locateMe}
        style={[overlayShadow, { bottom: peekHeight + 14 }]}
        className="absolute right-4 h-12 w-12 items-center justify-center rounded-full bg-white"
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="locate" size={20} color={colors.primary} />
        )}
      </Pressable>

      {/* ── Selected artisan card (pin tap) ── */}
      {selected ? (
        <View
          style={[overlayShadow, { bottom: peekHeight + 14 }]}
          className="absolute left-4 right-20 rounded-2xl bg-white p-3"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary">
              {artisanAvatar(selected.imageKey) ? (
                <Image
                  source={artisanAvatar(selected.imageKey)}
                  style={{ height: '100%', width: '100%' }}
                />
              ) : (
                <Text className="text-[15px] font-bold text-white">
                  {initials(selected.fullName)}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1">
                <Text numberOfLines={1} className="flex-shrink text-[15px] font-bold text-gray-900">
                  {selected.fullName}
                </Text>
                <MaterialCommunityIcons name="check-decagram" size={14} color="#3B82F6" />
              </View>
              <Text numberOfLines={1} className="text-[12px] text-gray-500">
                {selected.specialty} · ⭐ {selected.rating.toFixed(1)} ·{' '}
                {formatDistance(selected.distanceKm)} · ~
                {etaMinutes(selected.distanceKm)} min
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              onPress={() => setSelectedId(null)}
              hitSlop={8}
              className="h-7 w-7 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={15} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${selected.fullName}'s profile`}
            onPress={() => openProfile(selected.id)}
            className="mt-2.5 h-10 items-center justify-center rounded-xl bg-primary"
          >
            <Text className="text-[13px] font-bold text-white">View profile</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── Draggable bottom sheet: nearby artisan list ── */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: fullHeight,
          transform: [{ translateY }],
          shadowColor: '#0F172A',
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -6 },
          elevation: 18,
        }}
        className="rounded-t-[28px] bg-white"
      >
        {/* Drag handle + header (the pan target) */}
        <View {...pan.panHandlers}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Expand nearby artisans list"
            onPress={() => snapTo(snapRef.current === 'open' ? 'closed' : 'open')}
            className="items-center pb-1 pt-3"
          >
            <View className="h-1.5 w-12 rounded-full bg-gray-200" />
          </Pressable>
          <View className="px-5 pb-3 pt-1">
            <Text className="text-[17px] font-bold text-gray-900">
              {isLoading
                ? 'Finding artisans nearby…'
                : `${count} artisan${count === 1 ? '' : 's'} nearby`}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 text-[12px] text-gray-400">
              Sorted by distance from {area}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <View className="items-center px-8 py-10">
            <Text className="text-center text-[13px] text-gray-400">
              Couldn&apos;t load nearby artisans. Check your connection and try
              again.
            </Text>
          </View>
        ) : count === 0 ? (
          <View className="items-center px-8 py-10">
            <Ionicons name="construct-outline" size={28} color={colors.textMuted} />
            <Text className="mt-2 text-center text-[13px] text-gray-400">
              No artisans in this area yet
              {category ? ' for this category' : ''}. Try another category or
              widen your area.
            </Text>
          </View>
        ) : (
          <FlatList
            data={artisans}
            keyExtractor={(a) => a.id}
            contentContainerStyle={{ paddingBottom: tabSpace + 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ArtisanRow
                artisan={item}
                onPress={() => openProfile(item.id)}
                onLocate={
                  item.latitude != null && item.longitude != null
                    ? () => selectArtisan(item)
                    : undefined
                }
              />
            )}
          />
        )}
      </Animated.View>

      {/* ── Sheets ── */}
      <LocationSheet
        visible={locationVisible}
        selected={area}
        onSelect={setSelectedArea}
        onOpenMap={() => router.push('/location-picker')}
        onClose={() => setLocationVisible(false)}
      />
      <SearchSheet visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={active ? { selected: true } : {}}
      accessibilityLabel={`Filter: ${label}`}
      onPress={onPress}
      style={overlayShadow}
      className={
        active
          ? 'h-9 flex-row items-center rounded-full bg-primary px-4'
          : 'h-9 flex-row items-center rounded-full bg-white px-4'
      }
    >
      <Text
        className={
          active
            ? 'text-[13px] font-semibold text-white'
            : 'text-[13px] font-medium text-gray-700'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

const overlayShadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 6,
} as const;

const pinShadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.3,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 2 },
  elevation: 5,
} as const;

// Clean light "silver" style (Google provider; Apple Maps ignores it and uses
// its default light look). POIs/transit off for a calm Uber-like canvas.
const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d6e0' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f0f2f5' }] },
];
