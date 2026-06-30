import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtisanOnboardingHero } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';

/**
 * Artisan onboarding/welcome hero (01-artisan-onboarding-welcome). Entry point
 * into "Servika Pro" for a new provider — flows on to KYC → service setup →
 * dashboard. Unlike the customer onboarding (browse-first), the artisan path
 * leads with trust + earnings and a verification checklist.
 */
export default function ProOnboarding() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0B1220]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 px-6 pt-4">
          {/* Brand */}
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Ionicons name="construct" size={20} color={colors.white} />
            </View>
            <Text className="text-[20px] font-extrabold tracking-wide text-white">SERVIKA</Text>
            <View className="rounded-full bg-primary/20 px-2 py-0.5">
              <Text className="text-[11px] font-bold text-primary">PRO</Text>
            </View>
          </View>

          <View className="mt-10 flex-1 justify-center">
            <ArtisanOnboardingHero />
          </View>
        </View>

        {/* CTA */}
        <View className="px-6 pb-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/pro/kyc')}
            className="h-14 items-center justify-center rounded-2xl bg-white active:opacity-90"
          >
            <Text className="text-[16px] font-bold text-[#0B1220]">Get Started</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/pro/dashboard')}
            className="mt-3 items-center py-2"
            hitSlop={8}
          >
            <Text className="text-[14px] text-white/80">
              Already have an account? <Text className="font-bold text-white">Log in</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
