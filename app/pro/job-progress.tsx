import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtisanJobTimeline, ElapsedTimeCard, ProHeader } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { formatNaira, type ProgressStep } from '@/lib/artisan/mock';
import { useAdvanceArtisanJob, useArtisanJob } from '@/lib/artisan/jobHooks';
import type { BookingStatus } from '@/lib/booking/types';

/**
 * Artisan job-in-progress (08-job-progress), wired to the live job. The timeline
 * is derived from the booking status. The only real transition here is "Start
 * Work" (Arrived → InProgress); finishing routes to the completion screen, where
 * the customer (not the artisan) ultimately confirms completion.
 */
function timeline(status: BookingStatus): ProgressStep[] {
  const arrived = status === 'Arrived' || status === 'InProgress' || status === 'Completed';
  const inProgress = status === 'InProgress';
  const done = status === 'Completed';
  return [
    { id: 'arrived', title: 'Arrived at location', detail: 'Reached the customer location', state: arrived ? 'done' : 'current', time: arrived ? 'Done' : undefined },
    { id: 'diagnosing', title: 'Diagnosing issue', detail: 'Inspecting the reported fault', state: inProgress || done ? 'done' : arrived ? 'current' : 'upcoming' },
    { id: 'work', title: 'Work in progress', detail: 'Carrying out the repair', state: done ? 'done' : inProgress ? 'current' : 'upcoming', time: inProgress ? 'In Progress' : undefined },
    { id: 'completed', title: 'Job completed', detail: 'Customer confirms completion', state: done ? 'done' : 'upcoming', time: done ? 'Done' : 'Pending' },
  ];
}

export default function JobProgress() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading } = useArtisanJob(id);
  const advance = useAdvanceArtisanJob();

  if (isLoading || !job) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const amount = job.initialQuoteAmountNaira;
  const isArrived = job.status === 'Arrived';
  const isInProgress = job.status === 'InProgress';

  const primary = isArrived
    ? { label: 'Start Work', onPress: () => advance.mutate({ id: job.id, action: 'start' }) }
    : isInProgress
      ? { label: 'Finish Job', onPress: () => router.push(`/pro/job-completion?id=${job.id}`) }
      : { label: 'Back to Dashboard', onPress: () => router.replace('/pro/dashboard') };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ProHeader title="Job in Progress" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <Text className="text-[12px] text-gray-500">Current Job</Text>
          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-[16px] font-bold text-gray-900">{job.serviceName}</Text>
            {amount != null ? (
              <Text className="text-[16px] font-extrabold text-gray-900">{formatNaira(amount)}</Text>
            ) : null}
          </View>
          <Text className="text-[12px] text-gray-500">{job.addressText}</Text>
        </View>

        <Text className="mb-3 mt-6 text-[16px] font-bold text-gray-900">Job Progress</Text>
        <View className="rounded-2xl border border-gray-100 bg-white p-4">
          <ArtisanJobTimeline steps={timeline(job.status)} />
        </View>

        <View className="mt-4">
          <ElapsedTimeCard elapsed="00:45:32" />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white">
        <View className="px-5 py-3">
          <Pressable
            accessibilityRole="button"
            disabled={advance.isPending}
            onPress={primary.onPress}
            className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          >
            <Text className="text-[15px] font-bold text-white">{primary.label}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
