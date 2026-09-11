import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useBooking } from '@/lib/booking/hooks';
import { formatNaira } from '@/lib/catalogue/assets';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-2">
      <AppText className="text-[13px] text-gray-500">{label}</AppText>
      <View className="flex-1 items-end">{children}</View>
    </View>
  );
}

/**
 * Terminal screen after an escrow payment settles. Like booking/success it owns
 * the exit: hardware back and both buttons dismiss the stack first, so the
 * customer never walks back into the checkout or the pay button.
 */
export default function PaymentSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    amount?: string;
    fee?: string;
    reference?: string;
  }>();
  const { data: booking } = useBooking(params.bookingId);
  const amount = params.amount ? Number(params.amount) : booking?.initialQuoteAmountNaira ?? null;
  const fee = params.fee ? Number(params.fee) || 0 : 0;
  const [copied, setCopied] = useState(false);

  const leaveTo = (href: Href) => {
    router.dismissAll();
    router.replace(href);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      leaveTo('/home');
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyRef = async () => {
    if (!params.reference) return;
    await Clipboard.setStringAsync(params.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <StatusBar style="dark" />

      <View className="flex-1 px-6">
        <View className="mt-16 items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-green-500">
              <Ionicons name="checkmark" size={40} color={colors.white} />
            </View>
          </View>
          <AppText weight="semibold" className="mt-5 text-center text-[24px] text-gray-900">
            Payment successful
          </AppText>
          {amount != null ? (
            <AppText weight="semibold" className="mt-2 text-center text-[32px] text-gray-900">
              {formatNaira(amount)}
            </AppText>
          ) : null}
          <AppText className="mt-2 px-4 text-center text-[14px] leading-5 text-gray-500">
            Held securely by Servika. {booking?.artisanName ?? 'The artisan'} is paid only
            once you confirm the job is done.
          </AppText>
        </View>

        <View className="mt-8 rounded-3xl border border-gray-100 bg-white px-5 py-3">
          <Row label="Service">
            <AppText weight="medium" className="text-right text-[14px] text-gray-900">
              {booking?.serviceName ?? '—'}
            </AppText>
          </Row>
          <Row label="Artisan">
            <AppText weight="medium" className="text-right text-[14px] text-gray-900">
              {booking?.artisanName ?? '—'}
            </AppText>
          </Row>
          {fee > 0 ? (
            <Row label="Payment fee">
              <AppText weight="medium" className="text-right text-[14px] text-gray-900">
                {formatNaira(fee)}
              </AppText>
            </Row>
          ) : null}
          <Row label="Status">
            <View className="flex-row items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1">
              <Ionicons name="lock-closed" size={12} color="#15803D" />
              <AppText weight="medium" className="text-[12px] text-green-700">
                Held in escrow
              </AppText>
            </View>
          </Row>
          {params.reference ? (
            <Row label="Reference">
              <Pressable onPress={copyRef} className="flex-row items-center gap-1.5">
                <AppText className="text-right text-[12.5px] text-gray-700">
                  {params.reference}
                </AppText>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={14}
                  color={copied ? '#15803D' : colors.inkSubtle}
                />
              </Pressable>
            </Row>
          ) : null}
        </View>

        <View className="mt-auto gap-3 pb-2">
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              params.bookingId
                ? leaveTo({ pathname: '/booking/[id]', params: { id: params.bookingId } })
                : leaveTo('/bookings')
            }
            className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90"
          >
            <AppText weight="semibold" className="text-[16px] text-white">
              View booking
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => leaveTo('/home')}
            className="h-14 items-center justify-center rounded-2xl border border-gray-200 bg-white active:opacity-80"
          >
            <AppText weight="semibold" className="text-[16px] text-gray-900">
              Back to home
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
