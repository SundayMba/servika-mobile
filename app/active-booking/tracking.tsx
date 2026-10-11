import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { appAlert } from '@/components/ui/AppAlert';
import { ArtisanRow, VerifiedBadges } from '@/components/active-booking/parts';
import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/ui/Button';
import { LiveMap } from '@/components/tracking/LiveMap';
import { colors } from '@/constants/colors';
import { useArtisan } from '@/lib/catalogue/hooks';
import { authErrorMessage } from '@/lib/api/auth';
import { canCancel, cancelRefundNote } from '@/lib/booking/display';
import { useBooking, useCancelBooking } from '@/lib/booking/hooks';
import { useOpenChat } from '@/lib/chat/hooks';
import {
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
      <AppText weight="semibold" className={`mt-1 text-[12px] ${danger ? 'text-red-600' : 'text-primary'}`}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function LiveTracking() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; artisanId?: string; name?: string }>();
  const [sheet, setSheet] = useState(false);

  // Foreground location permission (best-effort) so the customer's own blue
  // dot shows — useful when THEY move to meet a stationary artisan.
  useEffect(() => {
    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, []);

  const bookingId = params.id && params.id !== 'demo' ? params.id : undefined;
  const { data: booking } = useBooking(bookingId);
  // Resolve the artisan from the param, or from the booking (e.g. when opened from
  // a notification that only knows the booking id).
  const artisanId = params.artisanId ?? booking?.artisanId ?? undefined;
  const { data: artisan } = useArtisan(artisanId);
  const { location, state } = useLiveTracking(bookingId);

  const name = artisan?.fullName || params.name || 'Your artisan';
  const { openForBooking } = useOpenChat();
  const { mutate: cancelBooking, isPending: cancelling } = useCancelBooking();

  const confirmCancel = () => {
    if (!bookingId) return;
    const refundNote = booking ? cancelRefundNote(booking) : '';
    appAlert('Cancel booking?', `${name} will be notified.${refundNote}`, [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () =>
          cancelBooking(bookingId, {
            onSuccess: () => {
              setSheet(false);
              router.back();
            },
            onError: (err) =>
              appAlert('Could not cancel', authErrorMessage(err, 'Please try again.')),
          }),
      },
    ]);
  };
  const openChat = () => {
    if (bookingId) openForBooking(bookingId, name);
  };
  const specialty = artisan?.specialty || 'Artisan';
  const imageKey = artisan?.imageKey || '';

  // Destination = the job address (falls back to a city centre if uncaptured).
  const destination: LatLng = useMemo(
    () =>
      booking?.locationLat != null && booking?.locationLng != null
        ? { latitude: booking.locationLat, longitude: booking.locationLng }
        : LAGOS,
    [booking?.locationLat, booking?.locationLng],
  );

  // Live position wins; before the first ping, fall back to the artisan's
  // last-known/base location (their onboarding pin) so the map is never empty
  // and the customer can even walk to meet a stationary artisan.
  const basePos: LatLng | null =
    artisan?.latitude != null && artisan?.longitude != null
      ? { latitude: artisan.latitude, longitude: artisan.longitude }
      : null;
  const artisanPos: LatLng | null = location
    ? { latitude: location.latitude, longitude: location.longitude }
    : basePos;

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

  // The headline follows the booking's real status; only OnMyWay makes an ETA claim.
  const bookingStatus = booking?.status;
  const distanceText = km != null && km > 0 ? formatDistance(km) : null;
  const status = (() => {
    if (!booking) return { title: 'Loading…', sub: 'Getting your booking' };
    if (bookingStatus === 'Arrived') return { title: 'Artisan has arrived', sub: 'They’re at your location' };
    if (bookingStatus === 'InProgress') return { title: 'Work in progress', sub: `${name.split(' ')[0]} is working on your job` };
    if (bookingStatus === 'AwaitingConfirmation') return { title: 'Work finished', sub: 'Review and confirm the job' };
    if (bookingStatus === 'Accepted' || bookingStatus === 'Pending') {
      return { title: 'Not on the way yet', sub: 'You’ll see them here once they set off' };
    }
    if (bookingStatus !== 'OnMyWay') return { title: 'Live tracking off', sub: 'This booking is not active' };
    if (state === 'error') return { title: 'Artisan on the way', sub: 'Live location unavailable right now' };
    if (state === 'connecting') return { title: 'Artisan on the way', sub: 'Locating your artisan' };
    if (!location)
      return {
        title: 'Artisan on the way',
        sub:
          basePos && distanceText
            ? `Last known position shown · about ${distanceText} away`
            : 'Waiting for live location…',
      };
    return {
      title: 'Artisan on the way',
      sub: [eta != null ? `ETA ${eta} min` : null, distanceText ? `${distanceText} away` : null]
        .filter(Boolean)
        .join(' · '),
    };
  })();
  // Only an en-route artisan gets an ETA in the bottom card.
  const showEta = bookingStatus === 'OnMyWay' && eta != null;
  const arrivedLook = bookingStatus === 'Arrived' || bookingStatus === 'InProgress';

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
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
        <AppText weight="semibold" className="text-[16px] text-gray-900">SERVIKA</AppText>
        {/* Spacer keeps the title centered (no dead menu button). */}
        <View className="h-10 w-10" />
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
            className={`h-10 w-10 items-center justify-center rounded-full ${arrivedLook ? 'bg-green-100' : 'bg-primary/10'}`}
          >
            <Ionicons
              name={arrivedLook ? 'checkmark-circle' : 'navigate'}
              size={20}
              color={arrivedLook ? '#16A34A' : colors.primary}
            />
          </View>
          <View className="ml-3 flex-1">
            <AppText weight="semibold" className="text-[15px] text-gray-900">{status.title}</AppText>
            <AppText className="text-[12px] text-gray-500">{status.sub}</AppText>
          </View>
          <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
        </Pressable>

        <LiveMap
          destination={destination}
          artisan={artisanPos}
          route={routeForMap}
          showsUserLocation
          artisanLabel={name.split(' ')[0]}
          destinationLabel="You"
        />
      </View>

      {/* Bottom card */}
      <View className="rounded-t-3xl bg-white px-5 pb-6 pt-5" style={{ elevation: 8 }}>
        <ArtisanRow
          name={name}
          specialty={specialty}
          rating={artisan?.rating}
          reviewCount={artisan?.reviewCount}
          completedJobs={artisan?.completedJobs}
          imageKey={imageKey}
          photoUrl={artisan?.photoUrl}
          right={
            showEta ? (
              <View className="items-end">
                <AppText weight="semibold" className="text-[18px] text-primary">{eta} min</AppText>
                {distanceText ? (
                  <AppText className="text-[11px] text-gray-400">{distanceText}</AppText>
                ) : null}
              </View>
            ) : undefined
          }
        />
        <View className="mt-3">
          <VerifiedBadges verified={artisan?.isVerified} certified={artisan?.hasCertificate} />
        </View>
        <View className="mt-4 flex-row gap-3">
          <ActionPill
            icon="chatbubble-ellipses"
            label="Message"
            onPress={openChat}
          />
          <ActionPill icon="information-circle" label="Details" onPress={() => setSheet(true)} />
        </View>
      </View>

      {/* Tracking details sheet */}
      <BottomSheet visible={sheet} onClose={() => setSheet(false)} estimatedHeight={460}>
        <AppText weight="semibold" className="text-[18px] text-gray-900">Tracking Details</AppText>
        <View className="mt-4">
          <ArtisanRow
            name={name}
            specialty={specialty}
            rating={artisan?.rating}
            reviewCount={artisan?.reviewCount}
            completedJobs={artisan?.completedJobs}
            imageKey={imageKey}
            photoUrl={artisan?.photoUrl}
          />
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-gray-50 p-3">
            <AppText className="text-[11px] text-gray-400">ETA</AppText>
            <AppText weight="semibold" className="text-[15px] text-gray-900">{showEta ? `${eta} min` : '—'}</AppText>
          </View>
          <View className="flex-1 rounded-2xl bg-gray-50 p-3">
            <AppText className="text-[11px] text-gray-400">Distance</AppText>
            <AppText weight="semibold" className="text-[15px] text-gray-900">{distanceText ?? '—'}</AppText>
          </View>
        </View>
        <View className="mt-4 rounded-2xl bg-gray-50 p-3">
          <AppText className="text-[11px] text-gray-400">Heading to</AppText>
          <AppText weight="semibold" className="text-[14px] text-gray-900" numberOfLines={2}>
            {booking?.addressText || 'Your location'}
          </AppText>
        </View>
        <View className="mt-4">
          <Button
            label="Open Chat"
            onPress={() => {
              setSheet(false);
              openChat();
            }}
          />
          {booking && canCancel(booking.status) ? (
            <Pressable
              accessibilityRole="button"
              disabled={cancelling}
              onPress={confirmCancel}
              className="mt-3 items-center py-2"
            >
              <AppText weight="semibold" className="text-[14px] text-red-500">
                {cancelling ? 'Cancelling…' : 'Cancel booking'}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
