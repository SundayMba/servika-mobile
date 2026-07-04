import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useMyArtisanProfile } from '@/lib/artisan/onboardingHooks';

/**
 * Pro entry gate. Routes a signed-in artisan by their onboarding/verification
 * state: no profile → onboarding welcome; verified → dashboard; otherwise
 * (pending/rejected) → the review-status screen.
 */
export default function ProGate() {
  const profile = useMyArtisanProfile();

  if (profile.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F172A]">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // 404 (or any load failure with no cached profile) → they haven't onboarded.
  if (profile.isError || !profile.data) {
    return <Redirect href="/pro/onboarding" />;
  }

  if (profile.data.verificationStatus === 'Verified') {
    return <Redirect href="/pro/dashboard" />;
  }

  return <Redirect href="/pro/pending-review" />;
}
