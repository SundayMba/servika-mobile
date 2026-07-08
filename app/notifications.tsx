import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  timeAgo,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/lib/notifications/hooks';
import type { AppNotification, NotificationType } from '@/lib/notifications/types';

/** Icon + tint for each notification category. */
function iconFor(type: NotificationType): {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
} {
  switch (type) {
    case 'Payment':
      return { name: 'card', color: '#059669', tint: '#D1FAE5' };
    case 'System':
      return { name: 'information-circle', color: '#2563EB', tint: '#DBEAFE' };
    case 'Chat':
      return { name: 'chatbubble-ellipses', color: '#16A34A', tint: '#DCFCE7' };
    case 'OpenJob':
      return { name: 'megaphone', color: colors.primary, tint: '#FFEDD5' };
    case 'Booking':
    default:
      return { name: 'briefcase', color: colors.primary, tint: '#FFEDD5' };
  }
}

/**
 * In-app notifications feed. Booking-status updates and payment receipts show
 * here (produced server-side); tapping one marks it read and opens the related
 * booking. The Home bell routes here and shows the unread badge.
 */
export default function Notifications() {
  const router = useRouter();
  const { status, user } = useAuth();
  const isAuthenticated = status === 'authenticated';
  const isArtisan = user?.role === 'Artisan';

  const query = useNotifications({ enabled: isAuthenticated });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = query.data ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/home');

  const onPressItem = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id);
    // Chat notifications deep-link to the conversation thread (both roles).
    if (n.conversationId) {
      router.push({ pathname: '/chat/[id]', params: { id: n.conversationId } });
      return;
    }
    // Open-job broadcasts (artisan) open the available-jobs pool, not a specific job.
    if (n.type === 'OpenJob') {
      router.push('/pro/available-jobs');
      return;
    }
    if (!n.bookingId) return;
    // Artisans open the job in their Pro surface; customers open the booking.
    if (isArtisan) {
      router.push({ pathname: '/pro/job/[id]', params: { id: n.bookingId } });
      return;
    }
    // Customer booking updates open the active-booking dashboard, which jumps
    // straight to the live map when the artisan is en route (and to the detail once
    // done). Payment/other notifications open the booking detail.
    if (n.type === 'Booking') {
      router.push({
        pathname: '/active-booking/dashboard',
        params: { bookingId: n.bookingId },
      });
    } else {
      router.push({ pathname: '/booking/[id]', params: { id: n.bookingId } });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text className="text-[17px] font-bold text-gray-900">Notifications</Text>
        {isAuthenticated && unread > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            hitSlop={8}
            onPress={() => markAll.mutate()}
          >
            <Text className="text-[12px] font-semibold text-primary">
              Mark all read
            </Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {!isAuthenticated ? (
        <GuestState onSignIn={() => router.push('/login')} />
      ) : query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={query.refetch}
              tintColor={colors.primary}
            />
          }
        >
          {items.map((n) => {
            const icon = iconFor(n.type);
            return (
              <Pressable
                key={n.id}
                accessibilityRole="button"
                onPress={() => onPressItem(n)}
                className="mb-2.5 flex-row items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3.5"
                style={
                  n.isRead ? undefined : { backgroundColor: '#FFFBF7', borderColor: '#FFE0CC' }
                }
              >
                <View
                  className="h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: icon.tint }}
                >
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="flex-1 text-[14px] font-bold text-gray-900">
                      {n.title}
                    </Text>
                    {!n.isRead ? (
                      <View className="h-2 w-2 rounded-full bg-primary" />
                    ) : null}
                  </View>
                  <Text className="mt-0.5 text-[12px] leading-4 text-gray-500">
                    {n.body}
                  </Text>
                  <Text className="mt-1 text-[11px] text-gray-400">
                    {timeAgo(n.createdAt)}
                  </Text>
                </View>
                {n.bookingId || n.conversationId || n.type === 'OpenJob' ? (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textMuted}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View
        className="h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: '#FFEDD5' }}
      >
        <Ionicons name="notifications-outline" size={36} color={colors.primary} />
      </View>
      <Text className="mt-5 text-[17px] font-bold text-gray-900">
        You&apos;re all caught up
      </Text>
      <Text className="mt-1.5 text-center text-[13px] leading-5 text-gray-500">
        Updates about your bookings — when an artisan accepts, is on the way, or
        finishes a job — will show up here.
      </Text>
    </View>
  );
}

function GuestState({ onSignIn }: { onSignIn: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View
        className="h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: '#FFEDD5' }}
      >
        <Ionicons name="notifications-outline" size={36} color={colors.primary} />
      </View>
      <Text className="mt-5 text-[17px] font-bold text-gray-900">
        Sign in for notifications
      </Text>
      <Text className="mt-1.5 text-center text-[13px] leading-5 text-gray-500">
        Log in to get updates about your bookings and payments.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onSignIn}
        className="mt-5 rounded-xl bg-primary px-6 py-3"
      >
        <Text className="text-[14px] font-bold text-white">Sign In</Text>
      </Pressable>
    </View>
  );
}
