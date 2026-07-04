import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { colors } from '@/constants/colors';
import {
  geocodeText,
  resolveCurrentArea,
  searchPlaces,
  type PlaceResult,
} from '@/lib/location/search';
import type { LatLng } from '@/lib/tracking/geo';

/**
 * Service-area picker. Three ways to set your area:
 *  1. **Use my current location** — GPS + reverse geocode (expo-location).
 *  2. **Search** — Google Places autocomplete (or native geocoding fallback).
 *  3. **Popular areas** — curated Lagos quick-picks.
 *
 * Local state only for now (no persisted saved-addresses backend yet).
 */
// Popular Lagos areas with approximate centre coordinates, so a quick-pick sets
// both the label and the coords that drive proximity sorting.
export const LAGOS_AREAS: { label: string; coords: LatLng }[] = [
  { label: 'Lekki, Lagos', coords: { latitude: 6.4478, longitude: 3.4723 } },
  { label: 'Victoria Island, Lagos', coords: { latitude: 6.4281, longitude: 3.4219 } },
  { label: 'Ikoyi, Lagos', coords: { latitude: 6.4529, longitude: 3.4347 } },
  { label: 'Ikeja, Lagos', coords: { latitude: 6.6018, longitude: 3.3515 } },
  { label: 'Yaba, Lagos', coords: { latitude: 6.5095, longitude: 3.3711 } },
  { label: 'Surulere, Lagos', coords: { latitude: 6.4999, longitude: 3.3543 } },
  { label: 'Ajah, Lagos', coords: { latitude: 6.4698, longitude: 3.5852 } },
  { label: 'Gbagada, Lagos', coords: { latitude: 6.5486, longitude: 3.3897 } },
  { label: 'Maryland, Lagos', coords: { latitude: 6.5719, longitude: 3.3672 } },
];

export function LocationSheet({
  visible,
  selected,
  onSelect,
  onOpenMap,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (area: string, coords?: LatLng | null) => void;
  /** Open the full-screen map picker (draggable pin). */
  onOpenMap: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  // Debounced search; aborts the in-flight request when the query changes.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchPlaces(q, controller.signal);
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Reset the query each time the sheet reopens.
  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  const choose = (area: string, coords?: LatLng | null) => {
    onSelect(area, coords);
    setQuery('');
    onClose();
  };

  // A search result carries no coords (Places autocomplete omits them), so
  // geocode the chosen label to coordinates before applying it.
  const chooseSearchResult = async (r: PlaceResult) => {
    const label = r.sub ? `${r.label}, ${r.sub}` : r.label;
    const coords = await geocodeText(label);
    choose(label, coords);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const area = await resolveCurrentArea();
      choose(area.label, { latitude: area.lat, longitude: area.lng });
    } catch (e) {
      Alert.alert(
        'Location unavailable',
        e instanceof Error ? e.message : 'Could not get your location.',
      );
    } finally {
      setLocating(false);
    }
  };

  const showingResults = query.trim().length >= 2;

  return (
    <BottomSheet visible={visible} onClose={onClose} estimatedHeight={560}>
      <Text className="mb-1 text-[18px] font-bold text-gray-900">
        Set your location
      </Text>
      <Text className="mb-4 text-[13px] text-gray-500">
        We&apos;ll show artisans closest to you.
      </Text>

      {/* Search */}
      <View
        className="mb-3 flex-row items-center gap-2.5 rounded-2xl px-3.5"
        style={{ backgroundColor: '#F1F5F9', height: 50 }}
      >
        <Ionicons name="search-outline" size={19} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for area, street, landmark…"
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

      {/* Use my current location */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use my current location"
        onPress={useCurrentLocation}
        disabled={locating}
        className="mb-1 flex-row items-center gap-3 rounded-2xl px-2 py-3"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: '#FFEDD5' }}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate" size={18} color={colors.primary} />
          )}
        </View>
        <Text className="flex-1 text-[15px] font-semibold text-primary">
          {locating ? 'Getting your location…' : 'Use my current location'}
        </Text>
      </Pressable>

      {/* Set precisely on a map (draggable pin) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Set location on map"
        onPress={() => {
          onClose();
          onOpenMap();
        }}
        className="mb-1 flex-row items-center gap-3 rounded-2xl px-2 py-3"
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: '#F1F5F9' }}
        >
          <Ionicons name="map-outline" size={18} color={colors.textPrimary} />
        </View>
        <Text className="flex-1 text-[15px] font-medium text-gray-800">
          Set location on map
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <View className="my-1 h-px bg-gray-100" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 320 }}
      >
        {showingResults ? (
          <>
            {searching ? (
              <View className="items-center py-6">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : results.length === 0 ? (
              <Text className="py-6 text-center text-[13px] text-gray-400">
                No matches for “{query.trim()}”.
              </Text>
            ) : (
              results.map((r) => (
                <Pressable
                  key={r.id}
                  accessibilityRole="button"
                  onPress={() => chooseSearchResult(r)}
                  className="flex-row items-center gap-3 rounded-2xl px-2 py-3"
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#F1F5F9' }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={17}
                      color={colors.textMuted}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[15px] font-medium text-gray-800"
                    >
                      {r.label}
                    </Text>
                    {r.sub ? (
                      <Text
                        numberOfLines={1}
                        className="mt-0.5 text-[12px] text-gray-400"
                      >
                        {r.sub}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))
            )}
          </>
        ) : (
          <>
            <Text className="mb-1 mt-1 px-2 text-[12px] font-semibold text-gray-400">
              POPULAR AREAS
            </Text>
            {LAGOS_AREAS.map(({ label, coords }) => {
              const active = label === selected;
              return (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => choose(label, coords)}
                  className="flex-row items-center gap-3 rounded-2xl px-2 py-3"
                  style={active ? { backgroundColor: '#FFF4EC' } : undefined}
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: active ? '#FFEDD5' : '#F1F5F9' }}
                  >
                    <Ionicons
                      name="location"
                      size={17}
                      color={active ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <Text
                    className={
                      active
                        ? 'flex-1 text-[15px] font-semibold text-gray-900'
                        : 'flex-1 text-[15px] text-gray-700'
                    }
                  >
                    {label}
                  </Text>
                  {active ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
