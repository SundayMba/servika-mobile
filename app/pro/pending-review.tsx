import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useKycStatus, useMyArtisanProfile } from '@/lib/artisan/onboardingHooks';

/**
 * Shown to an artisan whose profile isn't Verified yet. Pending → "under review";
 * Rejected → reason + re-submit. A refresh re-checks status; the Pro gate sends
 * them to the dashboard once approved.
 */
export default function PendingReview() {
  const router = useRouter();
  const { signOut } = useAuth();
  const profile = useMyArtisanProfile();
  const kyc = useKycStatus();

  const rejected =
    profile.data?.verificationStatus === 'Rejected' ||
    kyc.data?.status === 'Rejected';

  const refresh = () => {
    profile.refetch();
    kyc.refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: rejected ? '#FEE2E2' : '#FFEDD5' }}
        >
          <Ionicons
            name={rejected ? 'close-circle' : 'shield-checkmark'}
            size={48}
            color={rejected ? '#DC2626' : colors.primary}
          />
        </View>

        <Text className="mt-6 text-center text-[22px] font-extrabold text-gray-900">
          {rejected ? 'Verification declined' : 'Verification in review'}
        </Text>
        <Text className="mt-2 text-center text-[14px] leading-5 text-gray-500">
          {rejected
            ? kyc.data?.reviewNote ||
              'Something was off with your documents. Please re-submit clearer photos.'
            : "We're reviewing your details. This is usually quick — we'll notify you the moment you're approved."}
        </Text>

        {!rejected ? (
          <View className="mt-6 flex-row items-center gap-2 rounded-full bg-background px-4 py-2">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-[13px] font-medium text-gray-600">
              Pending review
            </Text>
          </View>
        ) : null}
      </View>

      <View className="px-6 pb-2">
        {rejected ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/pro/get-verified')}
            className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90"
          >
            <Text className="text-[16px] font-bold text-white">Re-submit documents</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={refresh}
            className="h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-90"
          >
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text className="text-[16px] font-bold text-white">Check status</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => signOut()}
          className="mt-3 items-center py-2"
        >
          <Text className="text-[13px] text-gray-400">Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
