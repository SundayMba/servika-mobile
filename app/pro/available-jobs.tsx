import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useClaimOpenJob, useOpenJobs } from '@/lib/artisan/jobHooks';
import type { BookingSummary } from '@/lib/booking/types';
import { formatDate } from '@/lib/booking/display';
import { timeAgo } from '@/lib/notifications/hooks';

export default function AvailableJobs() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useOpenJobs();
  const claim = useClaimOpenJob();

  const jobs = data ?? [];

  const onClaim = (id: string) => {
    if (claim.isPending) return;
    claim.mutate(id, {
      onSuccess: (job) => router.push(`/pro/start-trip?id=${job.id}`),
      onError: (e) => {
        // Most likely someone else got it first — refresh so it drops off the list.
        Alert.alert('Couldn’t accept', authErrorMessage(e, 'This job may have just been taken.'));
        refetch();
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      <View className="flex-row items-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/pro/dashboard'))}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View className="ml-2 flex-1">
          <Text className="text-[20px] font-bold text-gray-900">Available Jobs</Text>
          <Text className="text-[12px] text-gray-500">Open requests in your services — first to accept gets it</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {isError ? (
            <View className="mt-16 items-center">
              <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
              <Text className="mt-3 text-[14px] text-gray-500">Couldn&apos;t load available jobs</Text>
              <Pressable onPress={() => refetch()} className="mt-3 rounded-full bg-primary px-5 py-2">
                <Text className="text-[13px] font-bold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : jobs.length === 0 ? (
            <View className="mt-20 items-center px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="megaphone-outline" size={30} color={colors.primary} />
              </View>
              <Text className="mt-4 text-[15px] font-bold text-gray-800">No open jobs right now</Text>
              <Text className="mt-1.5 text-center text-[13px] leading-5 text-gray-500">
                When a customer posts a job in your service categories, it&apos;ll appear here to accept.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {jobs.map((job) => (
                <OpenJobCard
                  key={job.id}
                  job={job}
                  claiming={claim.isPending}
                  onClaim={() => onClaim(job.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function OpenJobCard({
  job,
  claiming,
  onClaim,
}: {
  job: BookingSummary;
  claiming: boolean;
  onClaim: () => void;
}) {
  const urgent = job.urgency === 'Urgent';
  return (
    <View className="rounded-3xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[15px] font-bold text-gray-900">{job.serviceName}</Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text className="flex-1 text-[12px] text-gray-500" numberOfLines={1}>
              {job.addressText}
            </Text>
          </View>
        </View>
        {urgent ? (
          <View className="rounded-full bg-red-100 px-2.5 py-1">
            <Text className="text-[10px] font-bold text-red-600">Urgent</Text>
          </View>
        ) : null}
      </View>

      <View className="mt-2.5 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text className="text-[12px] text-gray-600">{formatDate(job.preferredDate)}</Text>
        </View>
        {job.preferredTimeSlot ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={13} color={colors.textMuted} />
            <Text className="text-[12px] text-gray-600">{job.preferredTimeSlot}</Text>
          </View>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-[11px] text-gray-400">Posted {timeAgo(job.createdAt)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Accept ${job.serviceName} job`}
          disabled={claiming}
          onPress={onClaim}
          className="h-10 items-center justify-center rounded-xl bg-primary px-6 active:opacity-80"
          style={claiming ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-[14px] font-bold text-white">Accept job</Text>
        </Pressable>
      </View>
    </View>
  );
}
