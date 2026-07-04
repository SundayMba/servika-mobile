import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DashboardMetricCard,
  IncomingRequestPreview,
  TodayScheduleCard,
} from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { formatNaira } from '@/lib/artisan/mock';
import { bookingToCard } from '@/lib/artisan/jobDisplay';
import { useAdvanceArtisanJob, useArtisanJobs } from '@/lib/artisan/jobHooks';
import { useArtisanWallet } from '@/lib/artisan/walletHooks';
import { useAuth } from '@/lib/auth/AuthContext';
import { artisanAvatar } from '@/lib/catalogue/assets';
import { useMyArtisanProfile } from '@/lib/artisan/onboardingHooks';
import { useUnreadCount } from '@/lib/notifications/hooks';

const TAB_BAR_HEIGHT = 60;

export default function ProDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [online, setOnline] = useState(true);

  // The latest pending request, live from the API.
  const { data: pending } = useArtisanJobs('Pending');
  const advance = useAdvanceArtisanJob();
  const topRequest = pending?.[0];

  // Overview metrics — live from the jobs list + wallet ledger.
  const { data: allJobs } = useArtisanJobs();
  const { data: wallet } = useArtisanWallet();
  const { data: profile } = useMyArtisanProfile();
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.count ?? 0;
  const scheduleJobs = (allJobs ?? [])
    .filter((j) => ['Accepted', 'OnMyWay', 'Arrived', 'InProgress'].includes(j.status))
    .slice(0, 4);
  const jobsCount = allJobs?.length ?? 0;
  const completedCount =
    allJobs?.filter((j) => j.status === 'Completed').length ?? 0;

  const avatar = profile?.imageKey ? artisanAvatar(profile.imageKey) : undefined;
  const greetingName = user?.fullName ?? profile?.fullName ?? 'there';
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

  const acceptTop = (id: string) =>
    advance.mutate({ id, action: 'accept' }, { onSuccess: () => router.push(`/pro/start-trip?id=${id}`) });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-5 pb-1 pt-2">
        {avatar ? (
          <Image source={avatar} style={{ width: 44, height: 44, borderRadius: 22 }} contentFit="cover" />
        ) : (
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="person" size={22} color={colors.primary} />
          </View>
        )}
        <View className="ml-3 flex-1">
          <Text className="text-[13px] text-gray-500">Good morning,</Text>
          <Text className="text-[17px] font-bold text-gray-900">{greetingName}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/notifications')}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          {unreadCount > 0 ? (
            <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-red-500" />
          ) : null}
        </Pressable>
      </View>

      {/* Online toggle */}
      <View className="mx-5 mt-2 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-2.5">
        <View className="flex-row items-center gap-2">
          <View className={online ? 'h-2.5 w-2.5 rounded-full bg-green-500' : 'h-2.5 w-2.5 rounded-full bg-gray-300'} />
          <Text className="text-[14px] font-semibold text-gray-900">{online ? 'Online' : 'Offline'}</Text>
        </View>
        <Switch
          value={online}
          onValueChange={setOnline}
          trackColor={{ true: colors.primary, false: '#D1D5DB' }}
          thumbColor={colors.white}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}
      >
        {/* Today's Overview */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/pro/earnings')}
          className="mt-4 overflow-hidden rounded-3xl"
        >
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 18 }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] font-semibold text-white">Overview</Text>
              <Text className="text-[12px] text-primary">View all</Text>
            </View>
            <View className="mt-4 flex-row">
              <DashboardMetricCard value={String(jobsCount)} label="Jobs" />
              <View className="w-px bg-white/10" />
              <DashboardMetricCard value={String(completedCount)} label="Completed" />
              <View className="w-px bg-white/10" />
              <DashboardMetricCard
                value={formatNaira(wallet?.availableNaira ?? 0)}
                label="Balance"
              />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Incoming Requests */}
        <View className="mb-2 mt-6 flex-row items-center justify-between">
          <Text className="text-[16px] font-bold text-gray-900">Incoming Requests</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/pro/jobs')} hitSlop={8}>
            <Text className="text-[13px] font-semibold text-primary">View all</Text>
          </Pressable>
        </View>
        {topRequest ? (
          <IncomingRequestPreview
            job={bookingToCard(topRequest)}
            onAccept={() => acceptTop(topRequest.id)}
            onDecline={() => advance.mutate({ id: topRequest.id, action: 'reject' })}
          />
        ) : (
          <View className="items-center rounded-2xl border border-gray-100 bg-white py-8">
            <Ionicons name="checkmark-done-outline" size={28} color={colors.textMuted} />
            <Text className="mt-2 text-[13px] text-gray-500">No new requests right now</Text>
          </View>
        )}

        {/* Upcoming jobs (accepted / in-progress) */}
        <View className="mb-1 mt-6 flex-row items-center justify-between">
          <Text className="text-[16px] font-bold text-gray-900">Your schedule</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/pro/jobs')}>
            <Text className="text-[13px] font-semibold text-primary">View all</Text>
          </Pressable>
        </View>
        <View className="rounded-3xl border border-gray-100 bg-white px-4 pt-1">
          {scheduleJobs.length === 0 ? (
            <Text className="px-1 py-6 text-center text-[13px] text-gray-400">
              No scheduled jobs right now.
            </Text>
          ) : (
            scheduleJobs.map((j) => (
              <TodayScheduleCard
                key={j.id}
                time={j.preferredTimeSlot || 'Scheduled'}
                service={j.serviceName}
                area={j.addressText}
                tone="confirmed"
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
