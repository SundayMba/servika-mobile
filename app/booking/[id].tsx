import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import {
  canCancel,
  canDispute,
  formatDate,
  isAwaitingConfirmation,
  isEnRoute,
  isTrackable,
  statusStyle,
} from '@/lib/booking/display';
import { useBooking, useCancelBooking } from '@/lib/booking/hooks';
import type { BookingStatus } from '@/lib/booking/types';
import { formatNaira } from '@/lib/catalogue/assets';
import { useBookingDispute } from '@/lib/disputes/hooks';
import type { Dispute } from '@/lib/disputes/types';
import { timeAgo, useBookingReview } from '@/lib/reviews/hooks';

function StatusChip({ status }: { status: BookingStatus }) {
  const s = statusStyle(status);
  return (
    <View className={`self-start rounded-full px-3 py-1 ${s.bg}`}>
      <Text className={`text-[12px] font-bold ${s.text}`}>{s.label}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
      <Text className="mb-2 text-[12px] font-bold uppercase tracking-wide text-gray-400">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between py-1">
      <Text className="text-[13px] text-gray-500">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-[13px] font-medium text-gray-900">
        {value}
      </Text>
    </View>
  );
}

const DISPUTE_STATUS: Record<
  Dispute['status'],
  { label: string; bg: string; text: string }
> = {
  Open: { label: 'Reported', bg: 'bg-red-100', text: 'text-red-700' },
  UnderReview: { label: 'Under review', bg: 'bg-amber-100', text: 'text-amber-700' },
  Resolved: { label: 'Resolved', bg: 'bg-green-100', text: 'text-green-700' },
};

function DisputeCard({ dispute }: { dispute: Dispute }) {
  const chip = DISPUTE_STATUS[dispute.status];
  const outcome =
    dispute.resolution === 'FavourCustomer'
      ? 'Resolved in your favour.'
      : dispute.resolution === 'FavourArtisan'
        ? 'Reviewed — the job stands.'
        : null;
  return (
    <View className="mt-4 rounded-2xl border border-red-100 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-bold uppercase tracking-wide text-gray-400">
          Your reported issue
        </Text>
        <View className={`rounded-full px-3 py-1 ${chip.bg}`}>
          <Text className={`text-[12px] font-bold ${chip.text}`}>{chip.label}</Text>
        </View>
      </View>
      <Text className="mt-2 text-[14px] leading-5 text-gray-800">
        {dispute.description}
      </Text>
      {outcome ? (
        <View className="mt-3 rounded-xl bg-gray-50 p-3">
          <Text className="text-[12px] font-semibold text-gray-700">{outcome}</Text>
          {dispute.resolutionNote ? (
            <Text className="mt-1 text-[12px] leading-4 text-gray-500">
              {dispute.resolutionNote}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text className="mt-2 text-[12px] text-gray-400">
          Our team is reviewing your report and will get back to you.
        </Text>
      )}
    </View>
  );
}

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, isError } = useBooking(id);
  const { mutate: cancel, isPending: cancelling } = useCancelBooking();
  // Only look for a review once the job is done (avoids a 404 on other statuses).
  const { data: myReview } = useBookingReview(
    booking?.status === 'Completed' ? id : undefined,
  );
  // A dispute can exist while Disputed, or after it resolved (→ Completed/Cancelled).
  const disputable =
    booking?.status === 'Disputed' ||
    booking?.status === 'Completed' ||
    booking?.status === 'Cancelled';
  const { data: dispute } = useBookingDispute(disputable ? id : undefined);

  const confirmCancel = () => {
    Alert.alert(
      'Cancel booking?',
      'This will withdraw your request. You can always book again.',
      [
        { text: 'Keep booking', style: 'cancel' },
        {
          text: 'Cancel booking',
          style: 'destructive',
          onPress: () =>
            cancel(id, {
              onError: (err) =>
                Alert.alert(
                  'Could not cancel',
                  authErrorMessage(err, 'Please try again.'),
                ),
            }),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/bookings'))}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text className="text-[17px] font-bold text-gray-900">
          Booking Details
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError || !booking ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[14px] text-gray-500">
            We couldn’t load this booking. Pull back and try again.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 32 }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[20px] font-bold text-gray-900">
              {booking.serviceName}
            </Text>
            <StatusChip status={booking.status} />
          </View>
          {booking.artisanName ? (
            <Text className="mt-1 text-[13px] text-gray-500">
              with {booking.artisanName}
            </Text>
          ) : null}

          <Section title="Job">
            <Text className="text-[13px] leading-5 text-gray-700">
              {booking.description}
            </Text>
          </Section>

          <Section title="Schedule">
            <Row label="Date" value={formatDate(booking.preferredDate) || '—'} />
            <Row label="Time" value={booking.preferredTimeSlot || '—'} />
            <Row
              label="Urgency"
              value={
                booking.urgency?.toLowerCase() === 'urgent'
                  ? 'Urgent (2–4h)'
                  : 'Standard (24–48h)'
              }
            />
          </Section>

          <Section title="Location">
            <Text className="text-[13px] leading-5 text-gray-900">
              {booking.addressText}
            </Text>
            {booking.locationInstructions ? (
              <Text className="mt-1 text-[12px] leading-4 text-gray-500">
                {booking.locationInstructions}
              </Text>
            ) : null}
          </Section>

          <Section title="Pricing">
            {booking.initialQuoteAmountNaira != null ? (
              <Row
                label="Inspection / call-out fee"
                value={formatNaira(booking.initialQuoteAmountNaira)}
              />
            ) : null}
            {booking.paymentState === 'Refunded' ? (
              <View className="mt-2 flex-row items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                <Ionicons name="arrow-undo" size={15} color="#15803D" />
                <Text className="flex-1 text-[12px] font-semibold text-green-700">
                  Refunded{booking.initialQuoteAmountNaira != null ? ` · ${formatNaira(booking.initialQuoteAmountNaira)}` : ''} to your payment method
                </Text>
              </View>
            ) : booking.paymentState === 'Paid' ? (
              <Row label="Payment" value="Paid (held in escrow)" />
            ) : (
              <Text className="mt-1 text-[12px] leading-4 text-gray-500">
                Final price is quoted after the artisan inspects the job.
              </Text>
            )}
          </Section>

          {dispute ? <DisputeCard dispute={dispute} /> : null}

          {isAwaitingConfirmation(booking.status) ? (
            <View className="mt-6">
              <Button
                label="Review & confirm work"
                onPress={() =>
                  router.push({
                    pathname: '/active-booking/completion',
                    params: {
                      id: booking.id,
                      artisanId: booking.artisanId ?? undefined,
                      name: booking.artisanName ?? undefined,
                      serviceName: booking.serviceName,
                    },
                  })
                }
              />
            </View>
          ) : isTrackable(booking.status) || canCancel(booking.status) ? (
            <View className="mt-6 gap-3">
              {isTrackable(booking.status) ? (
                <Button
                  label={
                    isEnRoute(booking.status)
                      ? 'Track artisan live'
                      : 'Track Booking'
                  }
                  onPress={() =>
                    isEnRoute(booking.status)
                      ? router.push({
                          pathname: '/active-booking/tracking',
                          params: {
                            id: booking.id,
                            artisanId: booking.artisanId ?? undefined,
                            name: booking.artisanName ?? undefined,
                          },
                        })
                      : router.push({
                          pathname: '/active-booking/dashboard',
                          params: {
                            bookingId: booking.id,
                            artisanId: booking.artisanId ?? undefined,
                            serviceName: booking.serviceName,
                            artisanName: booking.artisanName ?? undefined,
                          },
                        })
                  }
                />
              ) : null}
              {canCancel(booking.status) ? (
                <Button
                  label="Cancel Booking"
                  variant="outline"
                  loading={cancelling}
                  onPress={confirmCancel}
                />
              ) : null}
            </View>
          ) : booking.status === 'Completed' ? (
            <View className="mt-6">
              {myReview ? (
                <View className="rounded-2xl border border-gray-100 bg-white p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[12px] font-bold uppercase tracking-wide text-gray-400">
                      Your review
                    </Text>
                    <Text className="text-[11px] text-gray-400">
                      {timeAgo(myReview.createdAt)}
                    </Text>
                  </View>
                  <View className="mt-2 flex-row gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons
                        key={n}
                        name={n <= myReview.rating ? 'star' : 'star-outline'}
                        size={18}
                        color={n <= myReview.rating ? colors.primary : colors.textMuted}
                      />
                    ))}
                  </View>
                  {myReview.comment ? (
                    <Text className="mt-2 text-[14px] leading-5 text-gray-700">
                      {myReview.comment}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Button
                  label="Leave a Review"
                  onPress={() =>
                    router.push({
                      pathname: '/review',
                      params: {
                        bookingId: booking.id,
                        artisanId: booking.artisanId ?? undefined,
                        name: booking.artisanName ?? undefined,
                        serviceName: booking.serviceName,
                      },
                    })
                  }
                />
              )}
            </View>
          ) : null}

          {canDispute(booking.status) && !dispute ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/report-issue',
                  params: { bookingId: booking.id },
                })
              }
              className="mt-4 flex-row items-center justify-center gap-1.5 py-2"
            >
              <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
              <Text className="text-[13px] font-semibold text-gray-500">
                Report an issue with this booking
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
