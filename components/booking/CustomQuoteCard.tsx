import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { appAlert } from '@/components/ui/AppAlert';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useAcceptBid, useBookingBids, useDeclineCustomQuote } from '@/lib/booking/hooks';
import type { Bid, BookingDetail } from '@/lib/booking/types';
import { formatNaira } from '@/lib/catalogue/assets';

/** Where this quote's labour sits against the typical range for the job. */
function RangeBar({ min, max, labour }: { min: number; max: number; labour: number }) {
  // Draw the range across the middle 60% of the bar so a quote below or above it still has room.
  const lo = min * 0.6;
  const hi = max * 1.6;
  const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%` as const;
  const inside = labour >= min && labour <= max;
  return (
    <View className="mt-3">
      <View className="h-2 rounded-full bg-gray-100">
        <View
          className="absolute h-2 rounded-full bg-green-200"
          style={{ left: pos(min), width: `${((max - min) / (hi - lo)) * 100}%` }}
        />
        <View
          className="absolute -top-1 h-4 w-4 rounded-full border-2 border-white"
          style={{ left: pos(labour), marginLeft: -8, backgroundColor: inside ? '#15803D' : colors.accentDeep }}
        />
      </View>
      <View className="mt-1.5 flex-row justify-between">
        <AppText className="text-[11.5px] text-gray-500">Typical labour {formatNaira(min)} to {formatNaira(max)}</AppText>
        <AppText weight="semibold" className={`text-[11.5px] ${inside ? 'text-green-700' : 'text-orange-700'}`}>
          {inside ? 'Within the range' : labour > max ? 'Above the range' : 'Below the range'}
        </AppText>
      </View>
    </View>
  );
}

/**
 * A custom job's quote (Business Model v1.4, section 10): the artisan's itemised price after the paid visit,
 * shown beside what similar jobs cost. Large quotes are checked by Servika before they appear here. The
 * customer accepts and pays the rest (the visit is credited), or declines and pays only the visit.
 */
export function CustomQuoteCard({ booking, onPay }: { booking: BookingDetail; onPay: () => void }) {
  const atTheDoor = booking.isCustomQuote && booking.status === 'Arrived' && !booking.agreedWorkmanshipNaira;
  const { data: bids, isLoading } = useBookingBids(booking.id, { enabled: !!atTheDoor });
  const accept = useAcceptBid();
  const decline = useDeclineCustomQuote(booking.id);

  if (!atTheDoor) return null;
  const fee = booking.diagnosisFeeNaira ?? 0;
  const who = booking.artisanName ?? 'The artisan';
  const quote: Bid | undefined = bids?.find((b) => b.status === 'Active');

  if (isLoading) {
    return (
      <View className="mt-4 items-center rounded-2xl border border-gray-100 bg-white p-4">
        <ActivityIndicator color={colors.accentDeep} />
      </View>
    );
  }

  const declineVisit = () =>
    appAlert(
      'Not go ahead?',
      `You pay only the ${formatNaira(fee)} visit, which ${who} keeps for coming out. You can book a second opinion any time.`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: 'End the visit',
          style: 'destructive',
          onPress: () => decline.mutate(undefined, { onError: (e) => appAlert('Could not end the visit', authErrorMessage(e, 'Please try again.')) }),
        },
      ],
    );

  if (!quote) {
    return (
      <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <AppText weight="semibold" className="text-[15px] text-gray-900">Waiting for the quote</AppText>
        </View>
        <AppText className="mt-1 text-[12.5px] leading-[18px] text-gray-500">
          {who} is looking at the job and will send an itemised quote here. Servika checks large quotes before you see them.
          Nothing is done until you accept.
        </AppText>
        <Pressable accessibilityRole="button" onPress={declineVisit} className="mt-2 items-center py-1.5">
          <AppText weight="semibold" className="text-[13px] text-gray-500">Not going ahead? Pay only the visit</AppText>
        </Pressable>
      </View>
    );
  }

  const total = Math.max(fee, quote.amountNaira);
  const toPay = Math.max(0, total - (booking.paidNaira ?? fee));
  const acceptQuote = () =>
    accept.mutate(
      { bookingId: booking.id, bidId: quote.id },
      {
        onSuccess: (b) => {
          if ((b.amountDueNaira ?? 0) > 0) onPay();
        },
        onError: (e) => appAlert('Could not accept', authErrorMessage(e, 'Please try again.')),
      },
    );

  return (
    <View className="mt-4 rounded-2xl border border-primary/20 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <AppText weight="semibold" className="text-[12px] uppercase tracking-wide text-gray-400">Quote from {who}</AppText>
        {quote.review === 'Approved' ? (
          <View className="flex-row items-center gap-1 rounded-full bg-green-50 px-2 py-0.5">
            <Ionicons name="shield-checkmark" size={12} color="#15803D" />
            <AppText weight="semibold" className="text-[11px] text-green-700">Checked by Servika</AppText>
          </View>
        ) : null}
      </View>
      <AppText weight="semibold" className="mt-2 text-[26px] text-gray-900">{formatNaira(quote.amountNaira)}</AppText>

      <View className="mt-2 gap-1">
        <View className="flex-row justify-between">
          <AppText className="text-[13px] text-gray-600">Labour</AppText>
          <AppText weight="medium" className="text-[13px] text-gray-900">{formatNaira(quote.workmanshipNaira)}</AppText>
        </View>
        {quote.materials.map((m, i) => (
          <View key={`${m.name}-${i}`} className="flex-row justify-between">
            <AppText className="flex-1 text-[13px] text-gray-600" numberOfLines={1}>
              {m.name}
              {m.quantity > 1 ? ` × ${m.quantity}` : ''}
            </AppText>
            <AppText weight="medium" className="text-[13px] text-gray-900">{formatNaira(m.quantity * m.unitPriceNaira)}</AppText>
          </View>
        ))}
        {quote.materialsNote ? <AppText className="mt-1 text-[12px] leading-4 text-gray-500">{quote.materialsNote}</AppText> : null}
      </View>

      {booking.typicalRangeMinNaira != null && booking.typicalRangeMaxNaira != null ? (
        <RangeBar min={booking.typicalRangeMinNaira} max={booking.typicalRangeMaxNaira} labour={quote.workmanshipNaira} />
      ) : null}

      <View className="mt-3 gap-1 rounded-xl bg-gray-50 p-3">
        <View className="flex-row justify-between">
          <AppText className="text-[13px] text-gray-500">Visit, already paid</AppText>
          <AppText weight="medium" className="text-[13px] text-green-700">−{formatNaira(Math.min(fee, quote.amountNaira))}</AppText>
        </View>
        <View className="mt-1 flex-row justify-between border-t border-gray-200 pt-2">
          <AppText weight="semibold" className="text-[14px] text-gray-900">To pay now</AppText>
          <AppText weight="semibold" className="text-[14px] text-gray-900">{formatNaira(toPay)}</AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={accept.isPending}
        onPress={acceptQuote}
        className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80"
        style={accept.isPending ? { opacity: 0.6 } : undefined}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
        <AppText weight="semibold" className="text-[14px] text-white">
          {accept.isPending ? 'Accepting…' : toPay > 0 ? `Accept and pay ${formatNaira(toPay)}` : 'Accept'}
        </AppText>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={decline.isPending} onPress={declineVisit} className="mt-1 items-center py-2">
        <AppText weight="semibold" className="text-[13px] text-gray-500">Don&apos;t go ahead, pay only the visit</AppText>
      </Pressable>
    </View>
  );
}
