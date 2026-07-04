import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';
import type { BookingStatus, BookingSummary } from '@/lib/booking/types';

// Friendly one-liner for each in-flight status.
const SUBTITLE: Partial<Record<BookingStatus, string>> = {
  Pending: 'Waiting for the artisan to accept',
  Accepted: 'Confirmed — preparing to head out',
  OnMyWay: 'On the way to you',
  Arrived: 'Your artisan has arrived',
  InProgress: 'Work in progress',
};

/** A green "live" dot with a slow expanding ring — mirrors the hero badge. */
function LiveDot() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1100 }), -1, true);
  }, [p]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.5 - p.value * 0.5,
    transform: [{ scale: 1 + p.value * 1.6 }],
  }));
  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { position: 'absolute', width: 8, height: 8, borderRadius: 999, backgroundColor: '#22C55E' },
          ring,
        ]}
      />
      <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: '#22C55E' }} />
    </View>
  );
}

/**
 * Resume card for in-flight bookings. With one booking it's static; with several
 * it becomes a vertical ticker that cycles content (slide + crossfade) and shows
 * page dots. The Track button always targets the booking currently on screen.
 */
export function ActiveBookingCarousel({
  bookings,
  onPress,
}: {
  bookings: BookingSummary[];
  onPress: (booking: BookingSummary) => void;
}) {
  const n = bookings.length;
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(1);
  const ty = useSharedValue(0);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (n <= 1) return;
    setIndex(0);
    const id = setInterval(() => {
      // Slide the current content up and fade it out…
      opacity.value = withTiming(0, { duration: 220 });
      ty.value = withTiming(-10, { duration: 220 });
      // …then swap to the next booking and glide the new content up into place.
      swapTimer.current = setTimeout(() => {
        setIndex((i) => (i + 1) % n);
        ty.value = 10;
        opacity.value = withTiming(1, { duration: 300 });
        ty.value = withTiming(0, { duration: 300 });
      }, 240);
    }, 4200);
    return () => {
      clearInterval(id);
      clearTimeout(swapTimer.current);
    };
  }, [n, opacity, ty]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const current = bookings[Math.min(index, n - 1)];
  const subtitle = SUBTITLE[current.status] ?? 'In progress';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Resume booking: ${current.serviceName}, ${subtitle}`}
      onPress={() => onPress(current)}
      style={{
        backgroundColor: '#0F172A',
        shadowColor: '#0F172A',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
      className="flex-row items-center rounded-2xl px-4 py-4"
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: 'rgba(249,115,22,0.16)' }}
      >
        <Ionicons name="navigate" size={20} color={colors.primary} />
      </View>

      {/* Cycling content lane (clipped so the slide stays inside the card). */}
      <View className="flex-1 px-3" style={{ overflow: 'hidden' }}>
        <Animated.View style={contentStyle}>
          <View className="flex-row items-center gap-2">
            <LiveDot />
            <Text numberOfLines={1} className="flex-shrink text-[14px] font-bold text-white">
              {current.serviceName}
            </Text>
          </View>
          <Text numberOfLines={1} className="mt-0.5 text-[11px] text-white/70">
            {current.artisanName ? `${current.artisanName} · ` : ''}
            {subtitle}
          </Text>
        </Animated.View>
      </View>

      <View className="items-end gap-1.5">
        <View className="rounded-full bg-primary px-3.5 py-2">
          <Text className="text-[12px] font-bold text-white">Track</Text>
        </View>
        {n > 1 ? (
          <View className="flex-row gap-1">
            {bookings.map((b, i) => (
              <View
                key={b.id}
                className={
                  i === index
                    ? 'h-1 w-3 rounded-full bg-white'
                    : 'h-1 w-1 rounded-full bg-white/40'
                }
              />
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
