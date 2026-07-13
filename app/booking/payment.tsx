import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { initializePayment } from '@/lib/api/payments';
import { useCreateBooking } from '@/lib/booking/hooks';
import { bookingMedia } from '@/lib/booking/mediaStore';
import type { CreateBookingRequest, Urgency } from '@/lib/booking/types';
import { formatNaira } from '@/lib/catalogue/assets';

type MethodId = 'online' | 'cash';

const METHODS: { id: MethodId; title: string; subtitle: string }[] = [
  { id: 'online', title: 'Pay online', subtitle: 'Card, bank transfer or mobile money' },
  { id: 'cash', title: 'Cash on service', subtitle: 'Pay after the job is done' },
];

/** Brand hints shown on the online option (the real method is chosen on the gateway). */
function MethodBrand({ id }: { id: MethodId }) {
  if (id !== 'online') return null;
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="rounded bg-[#1A1F71] px-1.5 py-0.5">
        <Text className="text-[9px] font-bold italic text-white">VISA</Text>
      </View>
      <View className="flex-row items-center">
        <View className="h-4 w-4 rounded-full bg-[#EB001B]" />
        <View className="-ml-1.5 h-4 w-4 rounded-full bg-[#F79E1B] opacity-90" />
      </View>
    </View>
  );
}

export default function BookingPayment() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    categorySlug?: string;
    artisanId?: string;
    description?: string;
    date?: string;
    time?: string;
    urgency?: string;
    instructions?: string;
    addressText?: string;
    lat?: string;
    lng?: string;
    serviceName?: string;
    artisanName?: string;
    amount?: string;
  }>();

  const [method, setMethod] = useState<MethodId>('online');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { mutateAsync: createBooking } = useCreateBooking();

  const amount = params.amount ? Number(params.amount) : null;

  const handlePay = async () => {
    setErrorMsg(null);
    if (!params.categorySlug) {
      setErrorMsg('Missing service category. Go back and try again.');
      return;
    }

    const body: CreateBookingRequest = {
      categorySlug: params.categorySlug,
      artisanId: params.artisanId ?? null,
      description: params.description ?? '',
      preferredDate: params.date ?? new Date().toISOString(),
      preferredTimeSlot: params.time ?? '',
      urgency: (params.urgency === 'urgent' ? 'urgent' : 'standard') as Urgency,
      addressText: params.addressText ?? '',
      locationLat: params.lat ? Number(params.lat) : null,
      locationLng: params.lng ? Number(params.lng) : null,
      locationInstructions: params.instructions || null,
    };

    setSubmitting(true);
    try {
      // 1. File the booking (created in Pending).
      const booking = await createBooking({
        ...body,
        mediaBase64: bookingMedia.get().photosBase64,
        videoBase64: bookingMedia.get().videoBase64,
      });
      bookingMedia.reset();

      // 2. For gateway methods, start the escrow payment and open the hosted
      //    checkout. The final result arrives asynchronously via the webhook, so
      //    we proceed to the success screen once the user returns. "Cash on
      //    Service" skips the gateway (paid in person after the job).
      if (method === 'online') {
        const init = await initializePayment(booking.id);
        if (init.authorizationUrl && /^https?:/i.test(init.authorizationUrl)) {
          await WebBrowser.openBrowserAsync(init.authorizationUrl);
        }
      }

      router.replace({
        pathname: '/booking/success',
        params: {
          bookingId: booking.id,
          serviceName: booking.serviceName,
          artisanName: booking.artisanName ?? params.artisanName ?? '',
          artisanId: params.artisanId ?? '',
          date: booking.preferredDate,
          time: booking.preferredTimeSlot,
          amount: amount != null ? String(amount) : '',
        },
      });
    } catch (err) {
      setErrorMsg(authErrorMessage(err, 'Could not place the booking.'));
    } finally {
      setSubmitting(false);
    }
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
          onPress={() => router.back()}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[17px] font-bold text-gray-900">Payment</Text>
          <Text className="text-[12px] text-gray-500">
            Choose a payment method
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >
        {METHODS.map((m) => {
          const selected = method === m.id;
          return (
            <Pressable
              key={m.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setMethod(m.id)}
              className={
                selected
                  ? 'mb-3 flex-row items-center rounded-2xl border-2 border-primary bg-primary/5 p-4'
                  : 'mb-3 flex-row items-center rounded-2xl border border-gray-200 bg-white p-4'
              }
            >
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected ? colors.primary : colors.textMuted}
              />
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-bold text-gray-900">
                  {m.title}
                </Text>
                <Text className="text-[12px] text-gray-500">{m.subtitle}</Text>
              </View>
              <MethodBrand id={m.id} />
            </Pressable>
          );
        })}

        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
          <Text className="text-[12px] text-gray-400">
            Your payment is secure and encrypted
          </Text>
        </View>

        {errorMsg ? (
          <View className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-3">
            <Text className="text-[13px] text-red-600">{errorMsg}</Text>
          </View>
        ) : null}

        <View className="mt-6">
          <Button
            label={method === 'cash' ? 'Confirm Booking' : 'Pay Now'}
            loading={submitting}
            onPress={handlePay}
          />
          <Text className="mt-3 text-center text-[14px] font-semibold text-gray-900">
            Total: {amount != null ? formatNaira(amount) : 'To be quoted'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
