import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';

const BENEFITS = [
  { icon: 'briefcase', text: 'Get more job opportunities near you' },
  { icon: 'calendar', text: 'Manage your jobs with ease' },
  { icon: 'cash', text: 'Get paid securely, withdraw anytime' },
] as const;

/**
 * Servika Pro welcome — the navy artisan-acquisition hero. Explains the artisan
 * value prop and leads into the Get Verified (KYC) flow.
 */
export default function ProOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? 'there';

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar style="light" />
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}
      >
        <View className="flex-1 px-6">
          <Animated.View entering={FadeIn.duration(400)} className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Ionicons name="construct" size={18} color="#FFFFFF" />
            </View>
            <Text className="text-[18px] font-extrabold tracking-tight text-white">
              Servika <Text className="text-primary">Pro</Text>
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mt-10">
            <Text className="text-[30px] font-extrabold leading-9 text-white">
              Welcome, {firstName}.{'\n'}Start earning as a{' '}
              <Text className="text-primary">verified artisan</Text>.
            </Text>
            <Text className="mt-3 text-[14px] leading-5 text-white/60">
              Join thousands of skilled artisans building their business with
              Servika. A quick verification and you&apos;re ready for jobs.
            </Text>
          </Animated.View>

          <View className="mt-9 gap-4">
            {BENEFITS.map((b, i) => (
              <Animated.View
                key={b.text}
                entering={FadeInDown.delay(220 + i * 90).duration(500)}
                className="flex-row items-center gap-3"
              >
                <View
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: 'rgba(249,115,22,0.16)' }}
                >
                  <Ionicons name={b.icon} size={20} color={colors.primary} />
                </View>
                <Text className="flex-1 text-[14px] font-medium text-white/90">
                  {b.text}
                </Text>
              </Animated.View>
            ))}
          </View>

          <View className="flex-1" />

          <Animated.View entering={FadeInDown.delay(520).duration(500)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Get started with verification"
              onPress={() => router.push('/pro/get-verified')}
              className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
            >
              <Text className="text-[16px] font-bold text-white">Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/pro/dashboard')}
              className="mt-3 items-center py-2"
            >
              <Text className="text-[13px] text-white/50">I&apos;ll do this later</Text>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}
