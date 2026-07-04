import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { JobRequestCard } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { useAdvanceArtisanJob, useArtisanJobs } from '@/lib/artisan/jobHooks';
import { bookingToCard, groupArtisanJobs, nextRouteForJob } from '@/lib/artisan/jobDisplay';
import type { BookingSummary } from '@/lib/booking/types';

const TAB_BAR_HEIGHT = 60;
type TabKey = 'new' | 'active' | 'history';

export default function ProJobs() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('new');

  // One fetch of all assigned jobs; grouped client-side into the three tabs.
  const { data, isLoading, isError, refetch, isRefetching } = useArtisanJobs();
  const advance = useAdvanceArtisanJob();
  const groups = useMemo(() => groupArtisanJobs(data), [data]);

  const lists: Record<TabKey, BookingSummary[]> = {
    new: groups.new,
    active: groups.active,
    history: groups.history,
  };
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'new', label: 'New', count: groups.new.length },
    { key: 'active', label: 'Active', count: groups.active.length },
    { key: 'history', label: 'History' },
  ];

  const jobs = lists[tab];
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

  const accept = (id: string) =>
    advance.mutate(
      { id, action: 'accept' },
      { onSuccess: () => router.push(`/pro/start-trip?id=${id}`) },
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-2">
        <Text className="text-[22px] font-bold text-gray-900">Job Requests</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/notifications')}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Segmented tabs */}
      <View className="flex-row gap-6 border-b border-gray-100 px-5">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} accessibilityRole="button" onPress={() => setTab(t.key)} className="pb-2.5">
              <View className={active ? 'border-b-2 border-primary pb-2' : 'border-b-2 border-transparent pb-2'}>
                <Text className={active ? 'text-[14px] font-bold text-primary' : 'text-[14px] font-medium text-gray-400'}>
                  {t.label}
                  {t.count != null ? ` (${t.count})` : ''}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomPadding }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {isError ? (
            <View className="mt-16 items-center">
              <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
              <Text className="mt-3 text-[14px] text-gray-500">Couldn&apos;t load your jobs</Text>
              <Pressable onPress={() => refetch()} className="mt-3 rounded-full bg-primary px-5 py-2">
                <Text className="text-[13px] font-bold text-white">Retry</Text>
              </Pressable>
            </View>
          ) : jobs.length === 0 ? (
            <View className="mt-16 items-center">
              <Ionicons name="file-tray-outline" size={40} color={colors.textMuted} />
              <Text className="mt-3 text-[14px] text-gray-500">Nothing here yet</Text>
            </View>
          ) : (
            <View className="gap-3">
              {jobs.map((job) => (
                <JobRequestCard
                  key={job.id}
                  job={bookingToCard(job)}
                  onPress={() => router.push(nextRouteForJob(job.id, job.status))}
                  onAccept={tab === 'new' ? () => accept(job.id) : undefined}
                  onDecline={tab === 'new' ? () => advance.mutate({ id: job.id, action: 'reject' }) : undefined}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
