import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtisanRow, VerifiedBadges } from '@/components/active-booking/parts';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/ui/Button';
import { LiveMap, type NearbyMarker } from '@/components/tracking/LiveMap';
import { colors } from '@/constants/colors';
import { MOCK_ARTISAN } from '@/lib/active-booking/mock';
import { useArtisan, useNearbyArtisans } from '@/lib/catalogue/hooks';
import { useBooking } from '@/lib/booking/hooks';
import {
  destinationPoint,
  distanceKm,
  etaMinutes,
  formatDistance,
  type LatLng,
} from '@/lib/tracking/geo';
import { useLiveTracking } from '@/lib/tracking/useTracking';
import { useRoute } from '@/lib/tracking/useRoute';

// Used only when a booking has no captured coordinates (older/seed bookings).
const LAGOS: LatLng = { latitude: 6.4541, longitude: 3.3947 };

function ActionPill({
  icon,
  label,
  tone = 'primary',
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'primary' | 'danger';
  onPress: () => void;
}) {
  const danger = tone === 'danger';
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-2xl py-3 ${danger ? 'bg-red-50' : 'bg-primary/5'}`}
    >
      <Ionicons name={icon} size={20} color={danger ? '#DC2626' : colors.primary} />
      <Text className={`mt-1 text-[12px] font-semibold ${danger ? 'text-red-600' : 'text-primary'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function LiveTracking() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; artisanId?: string; name?: string }>();
  const [sheet, setSheet] = useState(false);

  const bookingId = params.id && params.id !== 'demo' ? params.id : undefined;
  const { data: booking } = useBooking(bookingId);
  const { data: artisan } = useArtisan(params.artisanId);
  const { data: nearbyArtisans } = useNearbyArtisans();
  const { location, state } = useLiveTracking(bookingId);

  const name = artisan?.fullName || params.name || MOCK_ARTISAN.name;
  const specialty = artisan?.specialty || MOCK_ARTISAN.specialty;
  const imageKey = artisan?.imageKey || MOCK_ARTISAN.imageKey;
  const chatParams = { id: bookingId || 'demo', name };

  // Destination = the job address (falls back to a city centre if uncaptured).
  const destination: LatLng = useMemo(
    () =>
      booking?.locationLat != null && booking?.locationLng != null
        ? { latitude: booking.locationLat, longitude: booking.locationLng }
        : LAGOS,
    [booking?.locationLat, booking?.locationLng],
  );

  const artisanPos: LatLng | null = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : null;

  // Road-snapped route (backend proxy → Google when keyed, else straight stub).
  const { data: route } = useRoute(artisanPos, destination);
  const routeForMap = route
    ? { points: route.points, approximate: route.provider !== 'google' }
    : null;

  // ETA + distance: prefer the route service (traffic-aware) when present, else
  // fall back to a straight-line estimate.
  const straightKm = artisanPos ? distanceKm(artisanPos, destination) : null;
  const km = route ? route.distanceMeters / 1000 : straightKm;
  const eta = route
    ? Math.max(1, Math.round(route.durationSeconds / 60))
    : straightKm != null
      ? etaMinutes(straightKm, location?.speed)
      : null;

  // Scatter nearby artisans around the destination (catalogue carries distance,
  // not coordinates — see lib/tracking/geo destinationPoint).
  const nearby: NearbyMarker[] = useMemo(
    () =>
      (nearbyArtisans ?? [])
        .filter((a) => a.id !== params.artisanId)
        .slice(0, 6)
        .map((a, i) => ({
          id: a.id,
          position: destinationPoint(destination, a.distanceKm || 0.6 + i * 0.4, (i * 67) % 360),
        })),
    [nearbyArtisans, destination, params.artisanId],
  );

  const status = (() => {
    if (state === 'ended') return { title: 'Artisan has arrived', sub: 'They’re at your location' };
    if (state === 'error') return { title: 'Live tracking unavailable', sub: 'We’ll keep your booking updated' };
    if (state === 'connecting') return { title: 'Connecting…', sub: 'Locating your artisan' };
    if (!location) return { title: 'Artisan on the way', sub: 'Waiting for live location…' };
    return { title: 'Artisan on the way', sub: `ETA ${eta} min · ${formatDistance(km ?? 0)} away` };
  })();

  const cancel = () =>
    Alert.alert('Cancel booking?', 'This will withdraw your request.', [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => router.back() },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text className="text-[16px] font-extrabold text-gray-900">SERVIKA</Text>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textPrimary} />
        </View>
      </View>

      {/* Map area */}
      <View className="flex-1">
        {/* Floating status card */}
        <Pressable
          onPress={() => setSheet(true)}
          style={{ elevation: 4 }}
          className="absolute left-5 right-5 top-3 z-10 flex-row items-center rounded-2xl bg-white p-3.5 shadow"
        >
          <View
            className={`h-10 w-10 items-center justify-center rounded-full ${state === 'ended' ? 'bg-green-100' : 'bg-primary/10'}`}
          >
            <Ionicons
              name={state === 'ended' ? 'checkmark-circle' : 'navigate'}
              size={20}
              color={state === 'ended' ? '#16A34A' : colors.primary}
            />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[15px] font-bold text-gray-900">{status.title}</Text>
            <Text className="text-[12px] text-gray-500">{status.sub}</Text>
          </View>
          <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
        </Pressable>

        <LiveMap destination={destination} artisan={artisanPos} nearby={nearby} route={routeForMap} />
      </View>

      {/* Bottom card */}
      <View className="rounded-t-3xl bg-white px-5 pb-6 pt-5" style={{ elevation: 8 }}>
        <ArtisanRow
          name={name}
          specialty={specialty}
          rating={artisan?.rating ?? MOCK_ARTISAN.rating}
          jobsCount={artisan?.jobsCount ?? MOCK_ARTISAN.jobsCount}
          imageKey={imageKey}
          right={
            eta != null ? (
              <View className="items-end">
                <Text className="text-[18px] font-extrabold text-primary">{eta} min</Text>
                <Text className="text-[11px] text-gray-400">{formatDistance(km ?? 0)}</Text>
              </View>
            ) : undefined
          }
        />
        <View className="mt-3">
          <VerifiedBadges />
        </View>
        <View className="mt-4 flex-row gap-3">
          <ActionPill icon="call" label="Call" onPress={() => Alert.alert('Call', `Calling ${name}…`)} />
          <ActionPill
            icon="chatbubble-ellipses"
            label="Message"
            onPress={() => router.push({ pathname: '/chat/[id]', params: chatParams })}
          />
          <ActionPill icon="close-circle" label="Cancel" tone="danger" onPress={cancel} />
        </View>
      </View>

      {/* Tracking details sheet */}
      <BottomSheet visible={sheet} onClose={() => setSheet(false)} estimatedHeight={460}>
        <Text className="text-[18px] font-bold text-gray-900">Tracking Details</Text>
        <View className="mt-4">
          <ArtisanRow
            name={name}
            specialty={specialty}
            rating={artisan?.rating ?? MOCK_ARTISAN.rating}
            jobsCount={artisan?.jobsCount ?? MOCK_ARTISAN.jobsCount}
            imageKey={imageKey}
          />
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-gray-50 p-3">
            <Text className="text-[11px] text-gray-400">ETA</Text>
            <Text className="text-[15px] font-bold text-gray-900">{eta != null ? `${eta} min` : '—'}</Text>
          </View>
          <View className="flex-1 rounded-2xl bg-gray-50 p-3">
            <Text className="text-[11px] text-gray-400">Distance</Text>
            <Text className="text-[15px] font-bold text-gray-900">{km != null ? formatDistance(km) : '—'}</Text>
          </View>
        </View>
        <View className="mt-4 rounded-2xl bg-gray-50 p-3">
          <Text className="text-[11px] text-gray-400">Heading to</Text>
          <Text className="text-[14px] font-semibold text-gray-900" numberOfLines={2}>
            {booking?.addressText || 'Your location'}
          </Text>
        </View>
        <View className="mt-4">
          <Button
            label="Open Chat"
            onPress={() => {
              setSheet(false);
              router.push({ pathname: '/chat/[id]', params: chatParams });
            }}
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
