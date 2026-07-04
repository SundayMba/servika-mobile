import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtisanRow, StatusTimeline } from '@/components/active-booking/parts';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { TRACK_STEPS } from '@/lib/active-booking/mock';
import { statusStyle, isEnRoute, formatDate } from '@/lib/booking/display';
import { useBooking, useCancelBooking } from '@/lib/booking/hooks';
import { useArtisan } from '@/lib/catalogue/hooks';
import { authErrorMessage } from '@/lib/api/auth';

// Booking status → index in TRACK_STEPS (Request Sent, Accepted, On My Way, Arrived, Job Started).
const STEP_INDEX: Record<string, number> = {
  Pending: 0,
  Accepted: 1,
  OnMyWay: 2,
  Arrived: 3,
  InProgress: 4,
};

function shortRef(id?: string) {
  if (!id) return 'SVK-78D45';
  return `SVK-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
}

export default function ActiveBookingDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    artisanId?: string;
    serviceName?: string;
    artisanName?: string;
  }>();

  const bookingId =
    params.bookingId && params.bookingId !== 'demo' ? params.bookingId : undefined;
  const { data: booking } = useBooking(bookingId);
  const cancelBooking = useCancelBooking();

  const artisanId = params.artisanId ?? booking?.artisanId ?? undefined;
  const { data: artisan } = useArtisan(artisanId);
  const artisanName = params.artisanName || booking?.artisanName || artisan?.fullName || 'Your artisan';
  const serviceName = params.serviceName || booking?.serviceName || 'Your booking';
  const status = booking?.status;
  const chip = status ? statusStyle(status) : null;

  const linkParams = {
    id: params.bookingId || 'demo',
    artisanId,
    name: artisanName,
    serviceName,
  };

  // Route by real status (once): en route → jump straight to the live map;
  // completed → the booking detail (to leave a review). Otherwise stay on the hub.
  // `replace` so we don't loop back here.
  const jumped = useRef(false);
  useEffect(() => {
    if (jumped.current || !status) return;
    if (isEnRoute(status)) {
      jumped.current = true;
      router.replace({ pathname: '/active-booking/tracking', params: linkParams });
    } else if (status === 'AwaitingConfirmation') {
      jumped.current = true;
      router.replace({ pathname: '/active-booking/completion', params: linkParams });
    } else if (status === 'Completed' && bookingId) {
      jumped.current = true;
      router.replace({ pathname: '/booking/[id]', params: { id: bookingId } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const canCancel = status === 'Pending' || status === 'Accepted';
  const cancel = () => {
    if (!bookingId) return;
    Alert.alert('Cancel booking?', 'This will withdraw your request.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () =>
          cancelBooking.mutate(bookingId, {
            onSuccess: () => router.replace('/bookings'),
            onError: (e) => Alert.alert('Could not cancel', authErrorMessage(e, 'Please try again.')),
          }),
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <View className="flex-1 flex-row items-center gap-2.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <View>
            <Text className="text-[20px] font-bold text-gray-900">Active Booking</Text>
            <Text className="text-[12px] text-gray-500">
              Track your booking status in real time
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications')}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
      >
        {/* Booking card */}
        <View className="rounded-3xl border border-gray-100 bg-white p-4">
          <View className="flex-row items-start justify-between">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Ionicons name="flash" size={22} color={colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[16px] font-bold text-gray-900">
                {serviceName}
              </Text>
            </View>
            <View className={`rounded-full px-2.5 py-1 ${chip?.bg ?? 'bg-green-100'}`}>
              <Text className={`text-[11px] font-bold ${chip?.text ?? 'text-green-700'}`}>
                {chip?.label ?? 'Accepted'}
              </Text>
            </View>
          </View>

          <View className="mt-3 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text className="text-[12px] text-gray-600">
                {booking ? `${formatDate(booking.preferredDate) || '—'} • ${booking.preferredTimeSlot || '—'}` : '—'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text className="text-[12px] text-gray-600">
                {booking?.addressText || '—'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="receipt-outline" size={14} color={colors.textMuted} />
              <Text className="text-[12px] text-gray-600">
                Booking ID: {shortRef(params.bookingId)}
              </Text>
            </View>
          </View>

          <View className="my-4 h-px bg-gray-100" />

          <ArtisanRow
            name={artisanName}
            specialty={artisan?.specialty ?? ''}
            rating={artisan?.rating ?? 0}
            jobsCount={artisan?.jobsCount ?? ''}
            imageKey={artisan?.imageKey ?? ''}
            right={
              <Pressable
                onPress={() => router.push({ pathname: '/chat/[id]', params: linkParams })}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary/10"
              >
                <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
              </Pressable>
            }
          />
        </View>

        {/* Timeline */}
        <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-4">
          <StatusTimeline steps={TRACK_STEPS} current={status ? STEP_INDEX[status] ?? 0 : 0} />
          {chip ? (
            <Text className="mt-2 text-center text-[11px] text-gray-400">{chip.label}</Text>
          ) : null}
        </View>

        {/* Live tracking */}
        <Pressable
          onPress={() => router.push({ pathname: '/active-booking/tracking', params: linkParams })}
          className="mt-4 flex-row items-center rounded-2xl bg-primary/5 p-4 active:opacity-80"
        >
          <Ionicons name="navigate-circle-outline" size={22} color={colors.primary} />
          <View className="ml-3 flex-1">
            <Text className="text-[13px] font-bold text-gray-900">Track your artisan live</Text>
            <Text className="mt-0.5 text-[12px] leading-4 text-gray-600">
              Watch their location on the map once they’re on the way.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>

        {/* Actions */}
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Message"
              onPress={() => router.push({ pathname: '/chat/[id]', params: linkParams })}
            />
          </View>
          <View className="flex-1">
            <Button
              label="View Tracking"
              variant="outline"
              onPress={() =>
                router.push({ pathname: '/active-booking/tracking', params: linkParams })
              }
            />
          </View>
        </View>

        {canCancel ? (
          <Pressable
            onPress={cancel}
            disabled={cancelBooking.isPending}
            className="mt-4 flex-row items-center justify-center gap-1.5"
          >
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <Text className="text-[14px] font-semibold text-red-600">
              {cancelBooking.isPending ? 'Cancelling…' : 'Cancel Booking'}
            </Text>
          </Pressable>
        ) : null}

        <Text className="mt-5 text-center text-[11px] text-gray-400">
          🛡 Secure. Trusted. Servika.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
