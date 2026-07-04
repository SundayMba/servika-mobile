import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { formatDate } from '@/lib/booking/display';
import { artisanAvatar, formatNaira } from '@/lib/catalogue/assets';
import { useArtisan } from '@/lib/catalogue/hooks';

/** Short, human-friendly reference from the booking GUID, e.g. "SVK-8374A30F". */
function shortRef(id?: string) {
  if (!id) return 'SVK-—';
  return `SVK-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function Confetti() {
  const dots = [
    { top: 8, left: 30, color: '#F97316' },
    { top: 24, left: 90, color: '#3B82F6' },
    { top: 4, left: 150, color: '#22C55E' },
    { top: 30, left: 220, color: '#F59E0B' },
    { top: 12, left: 280, color: '#EC4899' },
    { top: 60, left: 16, color: '#22C55E' },
    { top: 70, left: 300, color: '#3B82F6' },
  ];
  return (
    <View pointerEvents="none" className="absolute inset-x-0 top-0 h-24">
      {dots.map((d, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: d.color,
            transform: [{ rotate: `${i * 35}deg` }],
          }}
        />
      ))}
    </View>
  );
}

export default function BookingSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    serviceName?: string;
    artisanName?: string;
    artisanId?: string;
    date?: string;
    time?: string;
    amount?: string;
  }>();

  const amount = params.amount ? Number(params.amount) : null;
  const { data: artisan } = useArtisan(params.artisanId || undefined);
  const avatar = artisan ? artisanAvatar(artisan.imageKey) : undefined;
  const [copied, setCopied] = useState(false);

  const copyRef = async () => {
    await Clipboard.setStringAsync(shortRef(params.bookingId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View className="flex-1 px-6">
        <Confetti />

        <View className="mt-16 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-green-500">
            <Ionicons name="checkmark" size={42} color={colors.white} />
          </View>
          <Text className="mt-5 text-[24px] font-bold text-gray-900">
            Booking Confirmed!
          </Text>
          <Text className="mt-1 text-center text-[14px] text-gray-500">
            Your request has been sent. The artisan will respond shortly.
          </Text>
        </View>

        {/* Receipt */}
        <View className="mt-8 rounded-3xl border border-gray-100 bg-white p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] text-gray-500">Booking ID</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Copy booking ID"
              onPress={copyRef}
              hitSlop={8}
              className="flex-row items-center gap-1.5 active:opacity-60"
            >
              <Text className="text-[14px] font-bold text-gray-900">
                {shortRef(params.bookingId)}
              </Text>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={15}
                color={copied ? '#22C55E' : colors.textMuted}
              />
            </Pressable>
          </View>

          <View className="my-4 h-px bg-gray-100" />

          {params.artisanName ? (
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-[13px] text-gray-500">Artisan</Text>
              <View className="flex-row items-center gap-2">
                {avatar ? (
                  <Image
                    source={avatar}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                    contentFit="cover"
                  />
                ) : null}
                <Text className="text-[14px] font-semibold text-gray-900">
                  {params.artisanName}
                </Text>
              </View>
            </View>
          ) : null}
          {params.serviceName ? (
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-[13px] text-gray-500">Service</Text>
              <Text className="text-[14px] font-semibold text-gray-900">
                {params.serviceName}
              </Text>
            </View>
          ) : null}
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-[13px] text-gray-500">Date & Time</Text>
            <Text className="text-[14px] font-semibold text-gray-900">
              {[formatDate(params.date), params.time].filter(Boolean).join(' • ') ||
                '—'}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-[13px] text-gray-500">Amount due now</Text>
            <Text className="text-[14px] font-bold text-primary">
              {amount != null ? formatNaira(amount) : 'To be quoted'}
            </Text>
          </View>
        </View>

        <View className="flex-1" />

        <View className="gap-3 pb-2">
          <Button
            label="Track Booking"
            onPress={() =>
              router.replace({
                pathname: '/active-booking/dashboard',
                params: {
                  bookingId: params.bookingId,
                  artisanId: params.artisanId,
                  serviceName: params.serviceName,
                  artisanName: params.artisanName,
                },
              })
            }
          />
          <Button
            label="View Booking"
            variant="outline"
            onPress={() =>
              params.bookingId
                ? router.replace(`/booking/${params.bookingId}`)
                : router.replace('/bookings')
            }
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/home')}
            className="items-center py-1"
          >
            <Text className="text-[14px] font-semibold text-gray-500">
              Back to Home
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
