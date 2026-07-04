import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';

/**
 * Home referral promo — launch growth mechanic. Refer an artisan, help them
 * onboard, and earn ₦500 cash once they complete their first job. Taps through
 * to the full `/refer` screen. Visually a warm-navy card with a slow shine
 * sweep, sitting a tier below the primary content.
 */
export function ReferralCard({ onPress }: { onPress: () => void }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(-120);
  useEffect(() => {
    if (!width) return;
    x.value = -120;
    x.value = withRepeat(
      withDelay(
        2200,
        withTiming(width + 120, {
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [width, x]);
  const shine = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { skewX: '-20deg' }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      accessibilityRole="button"
      accessibilityLabel="Refer an artisan and earn ₦500"
      onPress={onPress}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        backgroundColor: '#0F172A',
        overflow: 'hidden',
        shadowColor: '#0F172A',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
      }}
      className="flex-row items-center rounded-2xl px-4 py-4"
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'rgba(249,115,22,0.16)' }}
      >
        <Ionicons name="gift" size={24} color={colors.primary} />
      </View>

      <View className="flex-1 px-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-[14px] font-bold text-white">
            Refer an artisan
          </Text>
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-[10px] font-bold text-white">
              EARN ₦500
            </Text>
          </View>
        </View>
        <Text className="mt-1 text-[11px] leading-4 text-white/60">
          Help them onboard — get ₦500 cash on their first job.
        </Text>
      </View>

      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
      </View>

      {/* Slow diagonal shine */}
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', top: 0, bottom: 0, width: 60 }, shine]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.10)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}
