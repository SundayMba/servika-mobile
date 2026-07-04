import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Loading skeletons for the Home sections. These mirror the real layout of
 * `ServiceTile` / `ArtisanCard` so content lands without the page jumping —
 * a smoother, more premium feel than a bare spinner.
 */

/** A single gray block that gently pulses opacity while data loads. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: ViewStyle;
}) {
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      style={[{ backgroundColor: '#E2E6ED' }, style, animated]}
      className={className}
    />
  );
}

/** Matches the 4-across Popular Services grid (icon tile + label). */
export function ServiceGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <View className="flex-row flex-wrap" style={{ rowGap: 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} className="w-1/4 items-center">
          <Skeleton className="h-[68px] w-[68px] rounded-2xl" />
          <Skeleton className="mt-2 h-2.5 w-12 rounded-full" />
        </View>
      ))}
    </View>
  );
}

/** Matches the horizontal Nearby Artisans carousel (image + details card). */
export function ArtisanCarouselSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View
      className="flex-row"
      style={{ paddingHorizontal: 20, gap: 12 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className="w-56 overflow-hidden rounded-2xl bg-white"
          style={{
            shadowColor: '#0F172A',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Skeleton className="h-40 w-full" />
          <View className="px-3 pb-3 pt-2.5">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="mt-2 h-2.5 w-20 rounded-full" />
            <Skeleton className="mt-3 h-2.5 w-24 rounded-full" />
            <View className="mt-3 flex-row gap-2">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-16 rounded-xl" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
