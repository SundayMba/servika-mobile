import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useConversations } from '@/lib/chat/hooks';
import type { Conversation } from '@/lib/chat/types';
import { timeAgo } from '@/lib/notifications/hooks';

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export default function Messages() {
  const router = useRouter();
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const { data, isLoading, isRefetching, refetch } = useConversations({
    enabled: signedIn,
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />
      <View className="px-5 pb-2 pt-2">
        <AppText weight="semibold" className="text-[22px] text-gray-900">Messages</AppText>
      </View>

      {!signedIn ? (
        <Empty
          icon="lock-closed-outline"
          title="Sign in to view messages"
          body="Your conversations with artisans show up here."
        />
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !data?.length ? (
        <Empty
          icon="chatbubbles-outline"
          title="No conversations yet"
          body="Message an artisan from their profile to start a conversation."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {data.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              onPress={() =>
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: c.id, name: c.counterpartyName },
                })
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ConversationRow({
  conversation: c,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const unread = c.unreadCount > 0;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center border-b border-gray-50 px-5 py-3.5 active:bg-gray-50"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <AppText weight="semibold" className="text-[15px] text-primary">
          {initials(c.counterpartyName)}
        </AppText>
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <AppText weight="semibold" className="text-[15px] text-gray-900" numberOfLines={1}>
            {c.counterpartyName}
          </AppText>
          <AppText className="ml-2 text-[11px] text-gray-400">
            {timeAgo(c.lastMessageAtUtc)}
          </AppText>
        </View>
        <View className="mt-0.5 flex-row items-center justify-between">
          <AppText
            weight={unread ? 'semibold' : 'regular'}
            className={`flex-1 text-[13px] ${unread ? 'text-gray-800' : 'text-gray-500'}`}
            numberOfLines={1}
          >
            {c.lastMessage}
          </AppText>
          {unread ? (
            <View className="ml-2 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5">
              <AppText weight="semibold" className="text-[11px] text-white">{c.unreadCount}</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function Empty({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Ionicons name={icon} size={44} color={colors.textMuted} />
      <AppText weight="semibold" className="mt-4 text-center text-[16px] text-gray-800">{title}</AppText>
      <AppText className="mt-1.5 text-center text-[13px] leading-5 text-gray-500">{body}</AppText>
    </View>
  );
}
