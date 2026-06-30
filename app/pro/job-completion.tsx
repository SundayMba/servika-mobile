import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompletionSummaryCard, ProHeader } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { formatNaira } from '@/lib/artisan/mock';
import { useArtisanJob } from '@/lib/artisan/jobHooks';

/**
 * Job completion (09-job-completion), wired to the live job. The work is done
 * from the artisan's side (the job is InProgress); the **customer** confirms
 * completion in their app to close the booking and release the payout — so this
 * screen is informational and routes back to the dashboard rather than calling a
 * complete endpoint (there is no artisan-complete by design).
 */
export default function JobCompletion() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading } = useArtisanJob(id);

  if (isLoading || !job) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const amount = job.initialQuoteAmountNaira;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ProHeader title="Job Completed" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <View className="items-center pb-2 pt-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-green-500">
            <Ionicons name="checkmark" size={44} color={colors.white} />
          </View>
          <Text className="mt-4 text-[22px] font-extrabold text-gray-900">Great job!</Text>
          <Text className="mt-1 text-center text-[14px] text-gray-500">
            You&apos;ve finished the {job.serviceName.toLowerCase()}.
          </Text>
        </View>

        <View className="mt-4">
          <CompletionSummaryCard
            rows={[
              { label: 'Service', value: job.serviceName },
              { label: 'Total Time', value: '1h 25m' },
              ...(amount != null ? [{ label: 'Amount', value: formatNaira(amount) }] : []),
            ]}
          />
        </View>

        {/* Customer-confirms reality */}
        <View className="mt-4 flex-row items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <Ionicons name="time-outline" size={20} color="#D97706" />
          <Text className="flex-1 text-[13px] leading-5 text-amber-700">
            The customer will confirm completion to close the job and release your payout.
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white">
        <View className="px-5 py-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/pro/dashboard')}
            className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          >
            <Text className="text-[15px] font-bold text-white">Back to Dashboard</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="mt-3 h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/[0.06] active:opacity-80"
          >
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <Text className="text-[15px] font-bold text-primary">Add Photos (Optional)</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
