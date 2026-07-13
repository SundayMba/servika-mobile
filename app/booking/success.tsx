import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { formatDate } from '@/lib/booking/display';
import { artisanPhotoSource, formatNaira } from '@/lib/catalogue/assets';
import { useArtisan } from '@/lib/catalogue/hooks';

/** Short, human-friendly reference from the booking GUID, e.g. "SVK-8374A30F". */
function shortRef(id?: string) {
  if (!id) return 'SVK-—';
  return `SVK-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

// ── Confetti: a one-shot celebratory drop across the whole screen ──

const { width: WINDOW_W, height: WINDOW_H } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#F97316', '#FB923C', '#3B82F6', '#22C55E',
  '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4',
];

type Piece = {
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  /** 0 = strip, 1 = square, 2 = circle. */
  shape: number;
  turns: number;
  sway: number;
  phase: number;
};

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * (WINDOW_W - 12),
    delay: Math.random() * 700,
    duration: 2400 + Math.random() * 1600,
    size: 7 + Math.random() * 7,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: Math.floor(Math.random() * 3),
    turns: 1.5 + Math.random() * 2.5,
    sway: 1 + Math.random() * 2,
    phase: Math.random(),
  }));
}

/** One falling piece: gravity-eased drop with spin and side-to-side sway. */
function ConfettiPiece({ p }: { p: Piece }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      p.delay,
      withTiming(1, { duration: p.duration, easing: Easing.in(Easing.quad) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -60 + t.value * (WINDOW_H * 0.95) },
      {
        translateX:
          Math.sin((t.value * p.sway + p.phase) * Math.PI * 2) * 26,
      },
      { rotate: `${t.value * p.turns * 360}deg` },
    ],
    opacity: t.value < 0.8 ? 1 : Math.max(0, 1 - (t.value - 0.8) / 0.2),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: p.left,
          width: p.size,
          height: p.shape === 0 ? p.size * 0.45 : p.size,
          borderRadius: p.shape === 2 ? 999 : 2,
          backgroundColor: p.color,
        },
        style,
      ]}
    />
  );
}

function Confetti() {
  const pieces = useMemo(() => makePieces(55), []);
  return (
    <View pointerEvents="none" className="absolute inset-0">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} p={p} />
      ))}
    </View>
  );
}

// ── Receipt row: fixed label left, value right — long values wrap cleanly
// right-aligned instead of colliding with the label. ──
function ReceiptRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-1.5">
      <Text className="text-[13px] text-gray-500">{label}</Text>
      <View className="flex-1 items-end">{children}</View>
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
    open?: string;
    mode?: string;
  }>();

  const isOpen = params.open === '1';
  const amount = params.amount ? Number(params.amount) : null;
  const { data: artisan } = useArtisan(params.artisanId || undefined);
  const avatar = artisan ? artisanPhotoSource(artisan.photoUrl, artisan.imageKey) : undefined;
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
        <View className="mt-14 items-center">
          {/* Check mark in a soft halo */}
          <View className="h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-full bg-green-500">
              <Ionicons name="checkmark" size={40} color={colors.white} />
            </View>
          </View>
          <Text className="mt-5 text-center text-[24px] font-bold text-gray-900">
            {isOpen ? 'Request posted!' : 'Booking Confirmed!'}
          </Text>
          <Text className="mt-1.5 px-4 text-center text-[14px] leading-5 text-gray-500">
            {isOpen
              ? params.mode === 'RemoteQuote'
                ? 'Artisans are reviewing your photos and will send price offers. Compare them and pick your favourite.'
                : 'We’re finding you a verified pro nearby. You’ll be notified the moment one accepts.'
              : 'Your request has been sent. The artisan will respond shortly.'}
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
            <ReceiptRow label="Artisan">
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
            </ReceiptRow>
          ) : null}
          {params.serviceName ? (
            <ReceiptRow label="Service">
              <Text className="text-right text-[14px] font-semibold text-gray-900">
                {params.serviceName}
              </Text>
            </ReceiptRow>
          ) : null}
          <ReceiptRow label="Date & Time">
            <Text className="text-right text-[14px] font-semibold leading-5 text-gray-900">
              {[formatDate(params.date), params.time].filter(Boolean).join('\n') ||
                '—'}
            </Text>
          </ReceiptRow>
          <ReceiptRow label="Amount due now">
            <Text className="text-[14px] font-bold text-primary">
              {amount != null ? formatNaira(amount) : 'To be quoted'}
            </Text>
          </ReceiptRow>
        </View>

        <View className="flex-1" />

        <View className="gap-3 pb-2">
          {/* An open request has no artisan to track yet — go straight to the
              request detail; a pre-selected booking can open the live dashboard. */}
          {isOpen ? (
            <Button
              label="View Request"
              onPress={() =>
                params.bookingId
                  ? router.replace(`/booking/${params.bookingId}`)
                  : router.replace('/bookings')
              }
            />
          ) : (
            <>
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
            </>
          )}
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

      {/* Confetti drops over everything (never blocks taps) */}
      <Confetti />
    </SafeAreaView>
  );
}
