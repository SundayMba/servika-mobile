import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { config } from '@/lib/config';
import { initializePayment } from '@/lib/api/payments';
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
import { BottomSheet } from '@/components/BottomSheet';
import {
  useAcceptBid,
  useBooking,
  useBookingBids,
  useCancelBooking,
  useChoosePaymentMethod,
  useRebroadcast,
} from '@/lib/booking/hooks';
import type { Bid, BookingStatus } from '@/lib/booking/types';
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

// ── Offer sorting ────────────────────────────────────────────────────
// "Best match" mirrors the catalogue's RankScore (rating + certificate bonus),
// tie-broken by price then proximity — so a certified 4.8★ artisan outranks an
// uncertified 4.9★ one, and among equals the cheaper/closer offer wins.
type OfferSort = 'best' | 'price' | 'rating' | 'nearest';

const OFFER_SORTS: { key: OfferSort; label: string }[] = [
  { key: 'best', label: 'Best match' },
  { key: 'price', label: 'Lowest price' },
  { key: 'rating', label: 'Top rated' },
  { key: 'nearest', label: 'Nearest' },
];

function sortOffers(bids: Bid[], sort: OfferSort): Bid[] {
  const score = (b: Bid) => b.rating + (b.hasCertificate ? 0.5 : 0);
  const far = Number.POSITIVE_INFINITY;
  return [...bids].sort((a, b) => {
    switch (sort) {
      case 'price':
        return a.amountNaira - b.amountNaira || score(b) - score(a);
      case 'rating':
        return b.rating - a.rating || a.amountNaira - b.amountNaira;
      case 'nearest':
        return (a.distanceKm ?? far) - (b.distanceKm ?? far) || a.amountNaira - b.amountNaira;
      default:
        return (
          score(b) - score(a) ||
          a.amountNaira - b.amountNaira ||
          (a.distanceKm ?? far) - (b.distanceKm ?? far)
        );
    }
  });
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
  const { data: booking, isLoading, isError, refetch } = useBooking(id);
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
  // Price offers — while an open bidding request awaits a pick, or a direct
  // request awaits its artisan's quote (same machinery: offer → accept → pay).
  // The artisan can quote pre-visit (Pending) or en-route/on-site (Accepted →
  // Arrived, the inspect-first path), so the card lives until a price is agreed.
  const isDirectPending = booking?.status === 'Pending' && !!booking.artisanId;
  const isDirectAwaitingQuote =
    !!booking?.artisanId &&
    booking.paymentState !== 'Paid' &&
    booking.initialQuoteAmountNaira == null &&
    ['Pending', 'Accepted', 'OnMyWay', 'Arrived'].includes(booking.status);
  const acceptingBids =
    (booking?.status === 'Open' && booking.assessmentMode === 'RemoteQuote') ||
    isDirectAwaitingQuote;
  const { data: allBids } = useBookingBids(id, { enabled: !!acceptingBids });
  const [offerSort, setOfferSort] = useState<OfferSort>('best');
  const activeBids = allBids?.filter((b) => b.status === 'Active');
  const bids = activeBids ? sortOffers(activeBids, offerSort) : undefined;
  // Badge anchors: computed over the whole set so they don't move when sorting.
  const cheapestId =
    activeBids && activeBids.length > 1
      ? [...activeBids].sort((a, b) => a.amountNaira - b.amountNaira)[0].id
      : null;
  const topRatedId =
    activeBids && activeBids.length > 1
      ? [...activeBids].sort((a, b) => b.rating - a.rating)[0].id
      : null;
  const acceptBidMutation = useAcceptBid();
  const choosePayment = useChoosePaymentMethod();
  const rebroadcast = useRebroadcast();
  // Opens after a quote is accepted: escrow (recommended) vs cash after service.
  const [paySheetOpen, setPaySheetOpen] = useState(false);

  const [paying, setPaying] = useState(false);
  const payNow = async () => {
    if (!booking || paying) return;
    setPaying(true);
    try {
      const init = await initializePayment(booking.id);
      if (init.authorizationUrl && /^https?:/i.test(init.authorizationUrl)) {
        await WebBrowser.openBrowserAsync(init.authorizationUrl);
      }
      // Settlement lands via the webhook — refetch to pick up the new state.
      refetch();
    } catch (err) {
      Alert.alert('Payment failed', authErrorMessage(err, 'Please try again.'));
    } finally {
      setPaying(false);
    }
  };

  const confirmAcceptBid = (bid: Bid) => {
    Alert.alert(
      'Accept this offer?',
      `${bid.artisanName} will do the job for ${formatNaira(bid.amountNaira)}.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Accept offer',
          onPress: () =>
            acceptBidMutation.mutate(
              { bookingId: id, bidId: bid.id },
              {
                // Price agreed → straight to the payment moment.
                onSuccess: () => setPaySheetOpen(true),
                onError: (err) =>
                  Alert.alert(
                    'Could not accept',
                    authErrorMessage(err, 'Please try again.'),
                  ),
              },
            ),
        },
      ],
    );
  };

  const chooseCash = () =>
    choosePayment.mutate(
      { bookingId: id, method: 'cash' },
      {
        onSuccess: () => setPaySheetOpen(false),
        onError: (err) =>
          Alert.alert('Could not update', authErrorMessage(err, 'Please try again.')),
      },
    );

  const confirmRebroadcast = () => {
    Alert.alert(
      'Ask other artisans?',
      `Your request will be opened to all ${booking?.serviceName?.toLowerCase() ?? ''} artisans nearby — same details, nothing to re-type.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Ask other artisans',
          onPress: () =>
            rebroadcast.mutate(id, {
              onError: (err) =>
                Alert.alert('Could not re-post', authErrorMessage(err, 'Please try again.')),
            }),
        },
      ],
    );
  };

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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
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
          <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
          <Text className="mt-3 text-center text-[14px] text-gray-500">
            We couldn’t load this booking.
          </Text>
          <View className="mt-5 w-full gap-2.5">
            <Button label="Try again" onPress={() => refetch()} />
            <Button
              label="Back to bookings"
              variant="outline"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/bookings'))}
            />
          </View>
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

          {acceptingBids ? (
            <View className="mt-6">
              <Text className="mb-2 text-[15px] font-bold text-gray-900">
                {isDirectAwaitingQuote
                  ? bids?.length
                    ? 'Quote received'
                    : 'Waiting for a quote'
                  : `Price offers${bids?.length ? ` (${bids.length})` : ''}`}
              </Text>
              {!bids || bids.length === 0 ? (
                <View className="items-center rounded-2xl border border-gray-100 bg-white px-4 py-7">
                  <Ionicons name="pricetags-outline" size={26} color={colors.textMuted} />
                  <Text className="mt-2 text-[13px] font-semibold text-gray-700">
                    {isDirectAwaitingQuote ? 'No quote yet' : 'Waiting for offers'}
                  </Text>
                  <Text className="mt-0.5 text-center text-[12px] leading-4 text-gray-400">
                    {isDirectPending
                      ? `${booking.artisanName ?? 'The artisan'} is reviewing your request — they'll send a price, or come inspect for free first. We'll notify you.`
                      : isDirectAwaitingQuote
                        ? `${booking.artisanName ?? 'The artisan'} is inspecting the job (free) and will send their price here. You only pay after you accept it.`
                        : 'Artisans are reviewing your photos — offers usually arrive within a few hours. We’ll notify you.'}
                  </Text>
                  {isDirectPending ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={rebroadcast.isPending}
                      onPress={confirmRebroadcast}
                      className="mt-4 flex-row items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 active:opacity-70"
                    >
                      <Ionicons name="megaphone-outline" size={14} color={colors.primary} />
                      <Text className="text-[12.5px] font-bold text-primary">
                        {rebroadcast.isPending ? 'Opening up…' : 'Taking too long? Ask other artisans'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <>
                  {bids.length > 1 ? (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      className="mb-3"
                      contentContainerStyle={{ gap: 8 }}
                    >
                      {OFFER_SORTS.filter(
                        (s) => s.key !== 'nearest' || bids.some((b) => b.distanceKm != null),
                      ).map((s) => (
                        <Pressable
                          key={s.key}
                          accessibilityRole="button"
                          onPress={() => setOfferSort(s.key)}
                          className={`h-9 items-center justify-center rounded-full px-4 ${
                            offerSort === s.key ? 'bg-primary' : 'border border-gray-200 bg-white'
                          }`}
                        >
                          <Text
                            className={`text-[12.5px] font-bold ${
                              offerSort === s.key ? 'text-white' : 'text-gray-600'
                            }`}
                          >
                            {s.label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                  {bids.map((bid) => (
                  <View
                    key={bid.id}
                    className="mb-3 rounded-2xl border border-gray-100 bg-white p-4"
                  >
                    {bid.id === cheapestId || bid.id === topRatedId ? (
                      <View className="mb-2.5 flex-row gap-1.5">
                        {bid.id === cheapestId ? (
                          <View className="rounded-full bg-green-100 px-2.5 py-1">
                            <Text className="text-[10.5px] font-bold text-green-700">
                              💸 Lowest price
                            </Text>
                          </View>
                        ) : null}
                        {bid.id === topRatedId ? (
                          <View className="rounded-full bg-amber-100 px-2.5 py-1">
                            <Text className="text-[10.5px] font-bold text-amber-700">
                              ⭐ Top rated
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                    <View className="flex-row items-center">
                      <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                        {bid.photoUrl ? (
                          <Image
                            source={{ uri: `${config.apiBaseUrl}${bid.photoUrl}` }}
                            style={{ width: 44, height: 44 }}
                            contentFit="cover"
                          />
                        ) : (
                          <Text className="text-[15px] font-bold text-primary">
                            {bid.artisanName.trim().charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View className="ml-3 flex-1">
                        <View className="flex-row items-center gap-1.5">
                          <Text className="text-[14px] font-bold text-gray-900">
                            {bid.artisanName}
                          </Text>
                          {bid.hasCertificate ? (
                            <Ionicons name="ribbon" size={14} color={colors.primary} />
                          ) : null}
                        </View>
                        <View className="mt-0.5 flex-row items-center gap-1">
                          <Ionicons name="star" size={12} color="#FBBF24" />
                          <Text className="text-[12px] text-gray-500">
                            {bid.rating.toFixed(1)} ({bid.reviewCount} reviews)
                            {bid.distanceKm != null ? ` · ${bid.distanceKm} km away` : ''}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-[17px] font-extrabold text-primary">
                        {formatNaira(bid.amountNaira)}
                      </Text>
                    </View>
                    {bid.materialsNote ? (
                      <View className="mt-2.5 rounded-xl bg-background px-3 py-2">
                        <Text className="text-[12px] leading-4 text-gray-600">
                          <Text className="font-semibold">Needs: </Text>
                          {bid.materialsNote}
                        </Text>
                      </View>
                    ) : null}
                    <View className="mt-3 flex-row gap-2.5">
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({
                            pathname: '/artisan/[id]',
                            params: { id: bid.artisanId },
                          })
                        }
                        className="h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 active:opacity-70"
                      >
                        <Text className="text-[13px] font-semibold text-gray-700">
                          View profile
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={acceptBidMutation.isPending}
                        onPress={() => confirmAcceptBid(bid)}
                        className="h-11 flex-1 items-center justify-center rounded-xl bg-primary active:opacity-80"
                        style={acceptBidMutation.isPending ? { opacity: 0.6 } : undefined}
                      >
                        <Text className="text-[13px] font-bold text-white">
                          Accept offer
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  ))}
                </>
              )}
            </View>
          ) : null}

          {/* Direct request declined → offer the one-tap broadcast escape hatch */}
          {booking.status === 'Rejected' && booking.artisanId ? (
            <View className="mt-6 rounded-2xl border border-gray-100 bg-white p-4">
              <View className="flex-row items-center gap-2.5">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-gray-900">
                    {booking.artisanName ?? 'This artisan'} can&apos;t take this job
                  </Text>
                  <Text className="text-[12px] leading-4 text-gray-500">
                    Don&apos;t start over — send the same request to every{' '}
                    {booking.serviceName.toLowerCase()} artisan nearby.
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={rebroadcast.isPending}
                onPress={confirmRebroadcast}
                className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80"
                style={rebroadcast.isPending ? { opacity: 0.6 } : undefined}
              >
                <Ionicons name="megaphone-outline" size={16} color="#FFFFFF" />
                <Text className="text-[14px] font-bold text-white">
                  {rebroadcast.isPending ? 'Opening up…' : 'Ask other artisans instead'}
                </Text>
              </Pressable>
            </View>
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
                label={booking.pricingModel === 'Fixed' ? 'Fixed price' : 'Agreed price'}
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
            ) : booking.paymentMethod === 'Cash' &&
              booking.initialQuoteAmountNaira != null ? (
              // Cash chosen — remind, and leave the door open to switch back.
              <>
                <View className="mt-2 flex-row items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
                  <Ionicons name="cash-outline" size={16} color="#B45309" />
                  <Text className="flex-1 text-[12px] font-semibold leading-4 text-amber-700">
                    Cash on service — pay {formatNaira(booking.initialQuoteAmountNaira)} to{' '}
                    {booking.artisanName ?? 'the artisan'} when the job is done.
                    Cash jobs have limited dispute protection.
                  </Text>
                </View>
                {!['InProgress', 'AwaitingConfirmation', 'Completed', 'Cancelled', 'Disputed'].includes(
                  booking.status,
                ) ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={paying}
                    onPress={payNow}
                    className="mt-2.5 flex-row items-center justify-center gap-1.5 py-1.5"
                  >
                    <Ionicons name="lock-closed" size={13} color={colors.primary} />
                    <Text className="text-[13px] font-bold text-primary">
                      {paying ? 'Opening secure payment…' : 'Switch to secure online payment'}
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : booking.initialQuoteAmountNaira != null &&
              ['Accepted', 'OnMyWay', 'Arrived', 'InProgress', 'AwaitingConfirmation', 'Completed'].includes(
                booking.status,
              ) ? (
              // Unpaid with an agreed price → pay into escrow (or fall back to cash).
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={paying}
                  onPress={payNow}
                  className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80"
                  style={paying ? { opacity: 0.6 } : undefined}
                >
                  <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                  <Text className="text-[14px] font-bold text-white">
                    {paying
                      ? 'Opening secure payment…'
                      : `Pay ${formatNaira(booking.initialQuoteAmountNaira)} — held in escrow`}
                  </Text>
                </Pressable>
                <Text className="mt-2 text-center text-[11.5px] leading-4 text-gray-400">
                  Work starts once your payment is secured.
                </Text>
                {!['InProgress', 'AwaitingConfirmation', 'Completed'].includes(booking.status) ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={choosePayment.isPending}
                    onPress={chooseCash}
                    className="mt-1 items-center py-1"
                  >
                    <Text className="text-[12.5px] font-semibold text-gray-500">
                      Prefer cash? Pay after the service instead
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : booking.initialQuoteAmountNaira != null &&
              ['Pending'].includes(booking.status) ? (
              // Fixed-price booking waiting on the artisan to accept — payment
              // opens once they confirm (avoids charging for a job they decline).
              <Text className="mt-1 text-[12px] leading-4 text-gray-500">
                Waiting for {booking.artisanName ?? 'the artisan'} to accept. Once
                they confirm, pay {formatNaira(booking.initialQuoteAmountNaira)}{' '}
                securely — held until the job is done.
              </Text>
            ) : (
              <Text className="mt-1 text-[12px] leading-4 text-gray-500">
                Nothing to pay yet — you&apos;ll get a price to review first, and
                your payment is held securely until the job is done.
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

      {/* ── Payment moment: how to settle the agreed price ── */}
      <BottomSheet visible={paySheetOpen} onClose={() => setPaySheetOpen(false)}>
        <View className="px-5 pb-6 pt-1">
          <View className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="checkmark" size={28} color="#16A34A" />
            </View>
            <Text className="mt-3 text-[18px] font-bold text-gray-900">Price agreed!</Text>
            <Text className="mt-1 text-center text-[13px] leading-5 text-gray-500">
              {booking?.artisanName ?? 'Your artisan'} will do the job for{' '}
              <Text className="font-bold text-gray-900">
                {booking?.initialQuoteAmountNaira != null
                  ? formatNaira(booking.initialQuoteAmountNaira)
                  : 'the agreed price'}
              </Text>
              . How would you like to pay?
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={paying}
            onPress={() => {
              setPaySheetOpen(false);
              payNow();
            }}
            className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
          >
            <Ionicons name="lock-closed" size={17} color="#FFFFFF" />
            <Text className="text-[15px] font-bold text-white">
              Pay securely — held until job is done
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={choosePayment.isPending}
            onPress={chooseCash}
            className="mt-2.5 h-13 flex-row items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 active:opacity-70"
          >
            <Ionicons name="cash-outline" size={17} color={colors.textPrimary} />
            <Text className="text-[14px] font-semibold text-gray-700">
              {choosePayment.isPending ? 'Saving…' : 'Pay cash after service'}
            </Text>
          </Pressable>
          <Text className="mt-2.5 text-center text-[11.5px] leading-4 text-gray-400">
            Online payment is protected by escrow — released to the artisan only
            when you confirm the job. Cash jobs have limited dispute protection.
          </Text>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
