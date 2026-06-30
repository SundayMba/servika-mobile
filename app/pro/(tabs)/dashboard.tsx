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
import {
  DASHBOARD_STATS,
  MOCK_ME,
  TODAY_SCHEDULE,
  formatNaira,
} from '@/lib/artisan/mock';
import { bookingToCard } from '@/lib/artisan/jobDisplay';
import { useAdvanceArtisanJob, useArtisanJobs } from '@/lib/artisan/jobHooks';
import { useAuth } from '@/lib/auth/AuthContext';
import { artisanAvatar } from '@/lib/catalogue/assets';

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

  const avatar = artisanAvatar(MOCK_ME.imageKey);
  const greetingName = user?.fullName ?? MOCK_ME.name;
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
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-red-500" />
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
              <Text className="text-[14px] font-semibold text-white">Today&apos;s Overview</Text>
              <Text className="text-[12px] text-primary">View all</Text>
            </View>
            <View className="mt-4 flex-row">
              <DashboardMetricCard value={String(DASHBOARD_STATS.jobs)} label="Jobs" />
              <View className="w-px bg-white/10" />
              <DashboardMetricCard value={String(DASHBOARD_STATS.completed)} label="Completed" />
              <View className="w-px bg-white/10" />
              <DashboardMetricCard value={formatNaira(DASHBOARD_STATS.earningsNaira)} label="Earnings" />
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

        {/* Today's Schedule */}
        <View className="mb-1 mt-6 flex-row items-center justify-between">
          <Text className="text-[16px] font-bold text-gray-900">Today&apos;s Schedule</Text>
          <Pressable accessibilityRole="button" hitSlop={8}>
            <Text className="text-[13px] font-semibold text-primary">View calendar</Text>
          </Pressable>
        </View>
        <View className="rounded-3xl border border-gray-100 bg-white px-4 pt-1">
          {TODAY_SCHEDULE.map((s) => (
            <TodayScheduleCard
              key={s.id}
              time={s.time}
              service={s.service}
              area={s.area}
              tone={s.tone}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
