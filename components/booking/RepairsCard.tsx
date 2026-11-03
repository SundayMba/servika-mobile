import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { PhotoViewer } from '@/components/PhotoViewer';
import { appAlert } from '@/components/ui/AppAlert';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useBookingRepairs, useDecideRepairs } from '@/lib/booking/hooks';
import type { BookingDetail, BookingRepair } from '@/lib/booking/types';
import { formatNaira } from '@/lib/catalogue/assets';
import { config } from '@/lib/config';
import { useAuthHeaders } from '@/lib/media/useAuthHeaders';

function RepairRow({
  repair,
  checked,
  onToggle,
  onPhoto,
  headers,
}: {
  repair: BookingRepair;
  checked?: boolean;
  onToggle?: () => void;
  onPhoto: () => void;
  headers?: Record<string, string>;
}) {
  const decided = repair.status !== 'Proposed';
  return (
    <View className="flex-row items-center gap-3 py-3">
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Photo of the fault: ${repair.name}`} onPress={onPhoto}>
        <Image
          source={{ uri: `${config.apiBaseUrl}${repair.photoUrl}`, headers }}
          style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#EEE' }}
          contentFit="cover"
        />
      </Pressable>
      <Pressable
        accessibilityRole={decided ? undefined : 'checkbox'}
        accessibilityState={decided ? undefined : { checked: !!checked }}
        disabled={decided}
        onPress={onToggle}
        className="flex-1 flex-row items-center gap-3"
      >
        <View className="flex-1">
          <AppText weight="semibold" className="text-[14px] text-gray-900">{repair.name}</AppText>
          <AppText className="text-[12px] leading-4 text-gray-500">
            Labour {formatNaira(repair.labourNaira)}
            {repair.partsNaira > 0 ? ` · Parts ${formatNaira(repair.partsNaira)} (${repair.partsNote})` : ''}
          </AppText>
          {decided ? (
            <AppText weight="medium" className={`mt-0.5 text-[11.5px] ${repair.status === 'Approved' ? 'text-green-700' : 'text-gray-400'}`}>
              {repair.status === 'Approved' ? 'Approved' : 'Declined'}
            </AppText>
          ) : null}
        </View>
        <AppText weight="semibold" className="text-[14px] text-gray-900">{formatNaira(repair.totalNaira)}</AppText>
        {!decided ? (
          <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={22} color={checked ? colors.primary : colors.textMuted} />
        ) : null}
      </Pressable>
    </View>
  );
}

/**
 * Diagnose-and-fix, the customer's side (Business Model v1.4, section 7): the repairs the artisan found,
 * each priced from Servika's list with a photo of the fault. The customer ticks what to go ahead with and
 * sees exactly what they pay: the repairs, minus the diagnosis fee they already paid. Nothing is done
 * until they approve. Declining everything after a diagnosis ends the visit there.
 */
export function RepairsCard({ booking, onPay }: { booking: BookingDetail; onPay: () => void }) {
  // A custom job shows its quote first (CustomQuoteCard); repairs only come after the quote is accepted.
  const relevant =
    (!!booking.diagnosisFeeNaira || !!booking.priceBookItemId) && !(booking.isCustomQuote && booking.agreedWorkmanshipNaira == null);
  const live = ['Arrived', 'InProgress', 'AwaitingConfirmation', 'Completed'].includes(booking.status);
  const { data, isLoading } = useBookingRepairs(booking.id, relevant && live);
  const decide = useDecideRepairs(booking.id);
  const headers = useAuthHeaders();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [viewer, setViewer] = useState<number | null>(null);

  const repairs = useMemo(() => data?.repairs ?? [], [data]);
  const pending = useMemo(() => repairs.filter((r) => r.status === 'Proposed'), [repairs]);
  const decided = useMemo(() => repairs.filter((r) => r.status !== 'Proposed'), [repairs]);

  // Every new repair starts ticked: the artisan found it; the customer unticks what they don't want.
  useEffect(() => {
    setChecked((prev) => {
      const next = { ...prev };
      for (const r of pending) if (next[r.id] === undefined) next[r.id] = true;
      return next;
    });
  }, [pending]);

  if (!relevant || !live) return null;
  if (isLoading) {
    return (
      <View className="mt-4 items-center rounded-2xl border border-gray-100 bg-white p-4">
        <ActivityIndicator color={colors.accentDeep} />
      </View>
    );
  }
  if (!data || repairs.length === 0) {
    if (booking.status !== 'Arrived' || !booking.diagnosisFeeNaira) return null;
    return (
      <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="search-outline" size={18} color={colors.primary} />
          <AppText weight="semibold" className="text-[15px] text-gray-900">Finding the fault</AppText>
        </View>
        <AppText className="mt-1 text-[12.5px] leading-[18px] text-gray-500">
          {booking.artisanName ?? 'The artisan'} is checking the job. The repairs it needs come here, priced from Servika&apos;s list,
          for you to approve. Nothing is done before you say yes.
        </AppText>
      </View>
    );
  }

  const selected = pending.filter((r) => checked[r.id]);
  const selectedTotal = selected.reduce((sum, r) => sum + r.totalNaira, 0);
  const fee = data.diagnosisFeeNaira ?? 0;
  // What approving the ticked repairs costs on top of what is already paid. On a diagnosis the fee is
  // credited (the job costs the larger of the fee and the repairs); on a fixed job extras are added.
  const newTotal = fee > 0 ? Math.max(fee, data.approvedRepairsNaira + selectedTotal) : data.agreedTotalNaira + selectedTotal;
  const toPay = Math.max(0, newTotal - data.paidNaira);
  const credit = fee > 0 ? Math.min(fee, data.approvedRepairsNaira + selectedTotal) : 0;
  const isDiagnosisVisit = fee > 0 && data.approvedRepairsNaira === 0;

  const submit = (ids: string[]) =>
    decide.mutate(ids, {
      onSuccess: (r) => {
        if (r.amountDueNaira > 0) onPay();
      },
      onError: (err) => appAlert('Could not send your answer', authErrorMessage(err, 'Please try again.')),
    });

  const approve = () => {
    if (selected.length === 0) return declineAll();
    submit(selected.map((r) => r.id));
  };
  const declineAll = () =>
    appAlert(
      isDiagnosisVisit ? 'Not go ahead?' : 'Decline the extra repairs?',
      isDiagnosisVisit
        ? `You pay only the ${formatNaira(fee)} visit, which ${booking.artisanName ?? 'the artisan'} keeps for checking the job. You can book a second opinion any time.`
        : 'The artisan finishes the job you booked, at the price you paid.',
      [
        { text: 'Back', style: 'cancel' },
        { text: isDiagnosisVisit ? 'End the visit' : 'Decline', style: 'destructive', onPress: () => submit([]) },
      ],
    );

  const photos = repairs.map((r) => ({ uri: `${config.apiBaseUrl}${r.photoUrl}`, headers }));

  return (
    <View className="mt-4 rounded-2xl border border-primary/20 bg-white p-4">
      <AppText weight="semibold" className="text-[12px] uppercase tracking-wide text-gray-400">
        {pending.length > 0 ? 'Repairs to approve' : 'Repairs'}
      </AppText>
      {pending.length > 0 ? (
        <AppText className="mt-1 text-[12.5px] leading-[18px] text-gray-500">
          {booking.artisanName ?? 'The artisan'} found these. Labour is Servika&apos;s price; parts are listed beside it. Untick anything you
          don&apos;t want.
        </AppText>
      ) : null}

      <View className="mt-1 divide-y divide-gray-100">
        {pending.map((r) => (
          <RepairRow
            key={r.id}
            repair={r}
            checked={!!checked[r.id]}
            onToggle={() => setChecked((c) => ({ ...c, [r.id]: !c[r.id] }))}
            onPhoto={() => setViewer(repairs.indexOf(r))}
            headers={headers}
          />
        ))}
        {decided.map((r) => (
          <RepairRow key={r.id} repair={r} onPhoto={() => setViewer(repairs.indexOf(r))} headers={headers} />
        ))}
      </View>

      {pending.length > 0 ? (
        <>
          <View className="mt-2 gap-1 rounded-xl bg-gray-50 p-3">
            <View className="flex-row justify-between">
              <AppText className="text-[13px] text-gray-500">Repairs you ticked</AppText>
              <AppText weight="medium" className="text-[13px] text-gray-900">{formatNaira(selectedTotal)}</AppText>
            </View>
            {credit > 0 ? (
              <View className="flex-row justify-between">
                <AppText className="text-[13px] text-gray-500">Diagnosis fee, already paid</AppText>
                <AppText weight="medium" className="text-[13px] text-green-700">−{formatNaira(credit)}</AppText>
              </View>
            ) : null}
            <View className="mt-1 flex-row justify-between border-t border-gray-200 pt-2">
              <AppText weight="semibold" className="text-[14px] text-gray-900">To pay now</AppText>
              <AppText weight="semibold" className="text-[14px] text-gray-900">{formatNaira(toPay)}</AppText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={decide.isPending}
            onPress={approve}
            className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-80"
            style={decide.isPending ? { opacity: 0.6 } : undefined}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <AppText weight="semibold" className="text-[14px] text-white">
              {decide.isPending
                ? 'Sending…'
                : selected.length === 0
                  ? 'Go ahead with none'
                  : toPay > 0
                    ? `Approve and pay ${formatNaira(toPay)}`
                    : 'Approve'}
            </AppText>
          </Pressable>
          {selected.length > 0 ? (
            <Pressable accessibilityRole="button" disabled={decide.isPending} onPress={declineAll} className="mt-1 items-center py-2">
              <AppText weight="semibold" className="text-[13px] text-gray-500">
                {isDiagnosisVisit ? 'Don’t go ahead, pay only the visit' : 'Decline the extras'}
              </AppText>
            </Pressable>
          ) : null}
        </>
      ) : null}

      <PhotoViewer photos={photos} initialIndex={viewer ?? 0} visible={viewer !== null} onClose={() => setViewer(null)} />
    </View>
  );
}
