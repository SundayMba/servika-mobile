import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { formatDate, statusStyle } from '@/lib/booking/display';
import { useBookings } from '@/lib/booking/hooks';
import type { BookingStatus, BookingSummary } from '@/lib/booking/types';

type TabId = 'active' | 'completed' | 'cancelled';

const ACTIVE: BookingStatus[] = [
  'Pending',
  'Accepted',
  'OnMyWay',
  'Arrived',
  'InProgress',
];
const CANCELLED: BookingStatus[] = ['Cancelled', 'Rejected', 'Expired', 'Disputed'];

function inTab(status: BookingStatus, tab: TabId): boolean {
  if (tab === 'active') return ACTIVE.includes(status);
  if (tab === 'completed') return status === 'Completed';
  return CANCELLED.includes(status);
}

function BookingCard({
  booking,
  onPress,
}: {
  booking: BookingSummary;
  onPress: () => void;
}) {
  const s = statusStyle(booking.status);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border border-gray-100 bg-white p-4 active:opacity-90"
    >
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Ionicons name="construct-outline" size={22} color={colors.primary} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[15px] font-bold text-gray-900">
          {booking.serviceName}
        </Text>
        {booking.artisanName ? (
          <Text className="mt-0.5 text-[12px] text-gray-500">
            {booking.artisanName}
          </Text>
        ) : null}
        <View className="mt-1 flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text className="text-[12px] text-gray-500">
            {formatDate(booking.preferredDate) || 'Date TBD'}
            {booking.preferredTimeSlot ? ` • ${booking.preferredTimeSlot}` : ''}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <View className={`rounded-full px-2.5 py-1 ${s.bg}`}>
          <Text className={`text-[11px] font-bold ${s.text}`}>{s.label}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
          style={{ marginTop: 6 }}
        />
      </View>
    </Pressable>
  );
}

export default function Bookings() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('active');
  const { data, isLoading, isError, refetch, isRefetching } = useBookings();

  const counts = useMemo(() => {
    const all = data ?? [];
    return {
      active: all.filter((b) => inTab(b.status, 'active')).length,
      completed: all.filter((b) => inTab(b.status, 'completed')).length,
      cancelled: all.filter((b) => inTab(b.status, 'cancelled')).length,
    };
  }, [data]);

  const visible = useMemo(
    () => (data ?? []).filter((b) => inTab(b.status, tab)),
    [data, tab],
  );

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      <View className="px-5 pb-2 pt-3">
        <Text className="text-[22px] font-bold text-gray-900">Bookings</Text>
        <Text className="mt-0.5 text-[13px] text-gray-500">
          Track and manage all your bookings
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-5 pb-3">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(t.id)}
              className={
                active
                  ? 'flex-row items-center gap-1.5 rounded-full bg-primary px-3.5 py-2'
                  : 'flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-2'
              }
            >
              <Text
                className={
                  active
                    ? 'text-[13px] font-semibold text-white'
                    : 'text-[13px] font-semibold text-gray-600'
                }
              >
                {t.label}
              </Text>
              <View
                className={
                  active
                    ? 'rounded-full bg-white/25 px-1.5'
                    : 'rounded-full bg-gray-100 px-1.5'
                }
              >
                <Text
                  className={
                    active
                      ? 'text-[11px] font-bold text-white'
                      : 'text-[11px] font-bold text-gray-500'
                  }
                >
                  {t.count}
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
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[14px] text-gray-500">
            Couldn’t load your bookings. Pull to refresh.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="mt-24 items-center px-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="receipt-outline" size={30} color={colors.primary} />
              </View>
              <Text className="mt-4 text-[16px] font-bold text-gray-900">
                No {tab} bookings
              </Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-gray-500">
                {tab === 'active'
                  ? 'Find an artisan and request a service — it’ll show up here.'
                  : `You have no ${tab} bookings yet.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => router.push(`/booking/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
