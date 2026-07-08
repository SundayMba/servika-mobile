import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { JobDetailSection } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { formatNaira } from '@/lib/artisan/mock';
import { useAdvanceArtisanJob, useArtisanJob } from '@/lib/artisan/jobHooks';
import { statusStyle } from '@/lib/booking/display';
import { useOpenChat } from '@/lib/chat/hooks';

/**
 * Job details / accept screen (06-job-details-accept), wired to the live job.
 * Actions are status-aware: a Pending job shows Accept/Decline (real transitions);
 * an accepted/en-route job resumes the trip; an in-progress job resumes work; a
 * terminal job is read-only.
 */
export default function JobDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading } = useArtisanJob(id);
  const advance = useAdvanceArtisanJob();
  const { openForBooking } = useOpenChat();

  if (isLoading || !job) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const chip = statusStyle(job.status);
  const amount = job.initialQuoteAmountNaira;

  const onAccept = () =>
    advance.mutate({ id: job.id, action: 'accept' }, { onSuccess: () => router.replace(`/pro/start-trip?id=${job.id}`) });
  const onReject = () =>
    advance.mutate({ id: job.id, action: 'reject' }, { onSuccess: () => router.back() });

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Navy hero with the headline figures */}
      <LinearGradient colors={['#1E293B', '#0F172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View className="px-5 pb-5 pt-1">
            <View className="flex-row items-center justify-between">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={() => router.back()}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              >
                <Ionicons name="chevron-back" size={22} color={colors.white} />
              </Pressable>
              <View className={`rounded-full px-3 py-1 ${chip.bg}`}>
                <Text className={`text-[11px] font-bold ${chip.text}`}>{chip.label}</Text>
              </View>
            </View>
            <Text className="mt-3 text-[22px] font-bold text-white">{job.serviceName}</Text>
            <Text className="text-[13px] text-white/70">{job.addressText}</Text>
            {amount != null ? (
              <Text className="mt-3 text-[28px] font-extrabold text-white">{formatNaira(amount)}</Text>
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 }}
      >
        <Text className="mb-2 text-[16px] font-bold text-gray-900">Job Details</Text>
        <JobDetailSection
          rows={[
            { label: 'Service', value: job.serviceName },
            { label: 'Time Slot', value: job.preferredTimeSlot || '—' },
            { label: 'Urgency', value: job.urgency },
            { label: 'Job ID', value: `#${job.id.slice(0, 8).toUpperCase()}` },
          ]}
        />

        <Text className="mb-1.5 mt-5 text-[15px] font-bold text-gray-900">Job Description</Text>
        <Text className="text-[14px] leading-5 text-gray-600">{job.description}</Text>

        {job.locationInstructions ? (
          <>
            <Text className="mb-1.5 mt-5 text-[15px] font-bold text-gray-900">Access Notes</Text>
            <Text className="text-[14px] leading-5 text-gray-600">{job.locationInstructions}</Text>
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => openForBooking(job.id, 'Customer')}
          className="mt-6 flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 active:bg-gray-50"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-gray-900">Message customer</Text>
            <Text className="text-[12px] text-gray-500">Coordinate access, timing and details</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </ScrollView>

      {/* Sticky actions — depend on the job's current state */}
      <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white">
        <View className="px-5 py-3">
          {job.status === 'Pending' ? (
            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={advance.isPending}
                onPress={onReject}
                className="h-13 flex-1 items-center justify-center rounded-2xl border border-gray-200 py-3.5 active:opacity-70"
              >
                <Text className="text-[15px] font-semibold text-gray-700">Decline</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={advance.isPending}
                onPress={onAccept}
                className="h-13 flex-1 items-center justify-center rounded-2xl bg-primary py-3.5 active:opacity-80"
              >
                <Text className="text-[15px] font-bold text-white">Accept Job</Text>
              </Pressable>
            </View>
          ) : job.status === 'Accepted' || job.status === 'OnMyWay' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace(`/pro/start-trip?id=${job.id}`)}
              className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
            >
              <Text className="text-[15px] font-bold text-white">Continue to Trip</Text>
            </Pressable>
          ) : job.status === 'Arrived' || job.status === 'InProgress' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace(`/pro/job-progress?id=${job.id}`)}
              className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
            >
              <Text className="text-[15px] font-bold text-white">Continue Job</Text>
            </Pressable>
          ) : (
            <View className="h-14 items-center justify-center rounded-2xl bg-gray-100">
              <Text className="text-[15px] font-semibold text-gray-500">This job is {chip.label.toLowerCase()}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
