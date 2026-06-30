import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LiveMap } from '@/components/tracking/LiveMap';
import { ProHeader } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { useAdvanceArtisanJob, useArtisanJob } from '@/lib/artisan/jobHooks';
import {
  bearing,
  destinationPoint,
  distanceKm,
  etaMinutes,
  formatDistance,
  type LatLng,
} from '@/lib/tracking/geo';
import { useLocationStreamer } from '@/lib/tracking/useTracking';
import { useRoute } from '@/lib/tracking/useRoute';

const LAGOS: LatLng = { latitude: 6.4541, longitude: 3.3947 };

/**
 * Start Trip / navigation (07-start-trip-navigation), wired live. While the
 * booking is OnMyWay the artisan's GPS (expo-location) is streamed to the hub via
 * `SendLocationUpdate`, so the customer's tracking map updates in real time.
 * - "Start Navigation" → on-my-way (Accepted → OnMyWay), which begins streaming.
 * - "I've Arrived" → arrive (→ Arrived), which stops streaming, then job-progress.
 */
export default function StartTrip() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading } = useArtisanJob(id);
  const advance = useAdvanceArtisanJob();

  const [myPos, setMyPos] = useState<LatLng | null>(null);
  const [permDenied, setPermDenied] = useState(false);
  // Dev-only: drive the artisan along the route so movement is visible without
  // physically walking (e.g. on an emulator). __DEV__ gates the toggle UI.
  const [simulate, setSimulate] = useState(false);

  const streaming = job?.status === 'OnMyWay';
  const { ready, send } = useLocationStreamer(id, streaming);

  // Destination = the customer's address (fallback only while the job loads).
  // Memoised + kept above the early return so the hooks below run unconditionally.
  const destination: LatLng = useMemo(
    () =>
      job?.locationLat != null && job?.locationLng != null
        ? { latitude: job.locationLat, longitude: job.locationLng }
        : LAGOS,
    [job?.locationLat, job?.locationLng],
  );

  // Watch the real device GPS while streaming (unless simulating); push to the hub.
  useEffect(() => {
    if (!streaming || simulate) return;
    let cancelled = false;
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) setPermDenied(true);
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 8, timeInterval: 4000 },
        (loc) => {
          if (cancelled) return;
          const { latitude, longitude, accuracy, heading, speed } = loc.coords;
          setMyPos({ latitude, longitude });
          send({ latitude, longitude, accuracy, heading, speed });
        },
      );
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [streaming, simulate, send]);

  // Dev simulator: step from ~3 km out toward the destination every 2.5 s,
  // pushing each position to the hub so the customer (and this map) see movement.
  useEffect(() => {
    if (!streaming || !simulate) return;
    let cancelled = false;
    let cur = destinationPoint(destination, 3, 210);
    setMyPos(cur);

    const timer = setInterval(() => {
      if (cancelled) return;
      const remaining = distanceKm(cur, destination);
      if (remaining < 0.05) return; // arrived — hold position
      const h = bearing(cur, destination);
      cur = destinationPoint(cur, Math.min(0.15, remaining), h);
      setMyPos(cur);
      send({ latitude: cur.latitude, longitude: cur.longitude, accuracy: 5, heading: h, speed: 8 });
    }, 2500);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [streaming, simulate, destination, send]);

  const { data: route } = useRoute(myPos, destination);
  const routeForMap = route ? { points: route.points, approximate: route.provider !== 'google' } : null;
  const straightKm = myPos ? distanceKm(myPos, destination) : null;
  const km = route ? route.distanceMeters / 1000 : straightKm;
  const eta = route
    ? Math.max(1, Math.round(route.durationSeconds / 60))
    : straightKm != null
      ? etaMinutes(straightKm, null)
      : null;

  if (isLoading || !job) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const onStartNavigation = () => {
    if (job.status === 'Accepted') advance.mutate({ id: job.id, action: 'on-my-way' });
  };

  const onArrived = async () => {
    try {
      if (job.status === 'Accepted') await advance.mutateAsync({ id: job.id, action: 'on-my-way' });
      if (job.status !== 'Arrived') await advance.mutateAsync({ id: job.id, action: 'arrive' });
      router.replace(`/pro/job-progress?id=${job.id}`);
    } catch {
      // The mutation surfaces failures; stay on the screen so the artisan can retry.
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ProHeader
        title="Start Trip"
        right={
          <Pressable accessibilityRole="button" hitSlop={8} className="h-10 w-10 items-center justify-center">
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
          </Pressable>
        }
      />

      {/* Live map (artisan's own position → the customer's address) */}
      <View className="flex-1">
        <LiveMap destination={destination} artisan={myPos} route={routeForMap} />

        {/* Status pill */}
        <View className="absolute left-1/2 top-6 -ml-20 w-40 items-center rounded-2xl bg-[#0F172A] py-2">
          {streaming ? (
            <>
              <Text className="text-[14px] font-bold text-white">
                {eta != null ? `${eta} min` : 'Locating…'}
              </Text>
              <Text className="text-[11px] text-white/70">
                {ready ? 'sharing live location' : 'connecting…'}
              </Text>
            </>
          ) : (
            <Text className="text-[13px] font-semibold text-white">Tap Start Navigation</Text>
          )}
        </View>
      </View>

      {/* Bottom sheet */}
      <View className="rounded-t-3xl border-t border-gray-100 bg-white px-5 pb-2 pt-4" style={{ elevation: 12 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-[16px] font-bold text-gray-900">Navigate to Customer</Text>
            <View className="mt-1 flex-row items-center gap-1">
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text className="text-[13px] text-gray-500" numberOfLines={1}>
                {job.addressText}
              </Text>
            </View>
            {km != null ? (
              <Text className="mt-0.5 text-[12px] text-primary">{formatDistance(km)} away</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call customer"
            className="h-10 w-10 items-center justify-center rounded-full bg-primary/10"
          >
            <Ionicons name="call" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {permDenied ? (
          <Text className="mt-3 text-[12px] text-red-500">
            Location permission denied — the customer won’t see your live position. Enable it in Settings.
          </Text>
        ) : null}

        {/* Dev-only: simulate driving toward the customer (visible on an emulator). */}
        {__DEV__ ? (
          <View className="mt-3 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-background px-4 py-2.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="bug-outline" size={16} color={colors.textSecondary} />
              <Text className="text-[13px] font-medium text-gray-700">Simulate drive (dev)</Text>
            </View>
            <Switch
              value={simulate}
              onValueChange={setSimulate}
              trackColor={{ true: colors.primary, false: '#D1D5DB' }}
              thumbColor={colors.white}
            />
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onStartNavigation}
          disabled={streaming}
          className={`mt-4 h-14 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80 ${streaming ? 'bg-primary/40' : 'bg-primary'}`}
        >
          <Ionicons name="navigate" size={18} color={colors.white} />
          <Text className="text-[15px] font-bold text-white">
            {streaming ? 'Sharing location…' : 'Start Navigation'}
          </Text>
        </Pressable>

        <SafeAreaView edges={['bottom']}>
          <Pressable
            accessibilityRole="button"
            disabled={advance.isPending}
            onPress={onArrived}
            className="mt-3 h-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/[0.06] active:opacity-80"
          >
            <Text className="text-[15px] font-bold text-primary">I&apos;ve Arrived</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}
