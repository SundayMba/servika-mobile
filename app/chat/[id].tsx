import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  useChatMessages,
  useChatRealtime,
  useSendMessage,
} from '@/lib/chat/hooks';

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function messageTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  // The `id` route param is the booking id — a conversation is per-booking.
  const bookingId = params.id && params.id !== 'demo' ? params.id : undefined;
  const name = params.name || 'Chat';

  const { data: messages, isLoading } = useChatMessages(bookingId);
  const sendMessage = useSendMessage(bookingId ?? '');
  useChatRealtime(bookingId);

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages?.length) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages?.length]);

  const send = () => {
    const text = draft.trim();
    if (!text || !bookingId || sendMessage.isPending) return;
    setDraft('');
    sendMessage.mutate(text, {
      onError: () => setDraft(text), // restore the draft so nothing is lost
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 px-4 py-2">
        <Pressable
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/messages'))}
          className="pr-2"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Text className="text-[13px] font-bold text-primary">{initials(name)}</Text>
        </View>
        <View className="ml-2 flex-1">
          <Text className="text-[15px] font-bold text-gray-900">{name}</Text>
          <Text className="text-[11px] text-gray-400">Booking chat</Text>
        </View>
        {bookingId ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: '/booking/[id]', params: { id: bookingId } })
            }
          >
            <Text className="text-[12px] font-semibold text-primary">View Booking</Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            className="flex-1"
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
            keyboardShouldPersistTaps="handled"
          >
            {!messages?.length ? (
              <View className="flex-1 items-center justify-center px-8">
                <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
                <Text className="mt-3 text-center text-[13px] text-gray-400">
                  No messages yet. Say hello to coordinate the job.
                </Text>
              </View>
            ) : (
              messages.map((m) => {
                const mine = m.senderUserId === user?.id;
                return (
                  <View
                    key={m.id}
                    className={`mb-2 max-w-[78%] ${mine ? 'self-end' : 'self-start'}`}
                  >
                    <View
                      className={
                        mine
                          ? 'rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5'
                          : 'rounded-2xl rounded-bl-md bg-gray-100 px-3.5 py-2.5'
                      }
                    >
                      <Text className={mine ? 'text-[14px] text-white' : 'text-[14px] text-gray-900'}>
                        {m.body}
                      </Text>
                    </View>
                    <Text
                      className={`mt-0.5 text-[10px] text-gray-400 ${mine ? 'text-right' : 'text-left'}`}
                    >
                      {messageTime(m.createdAt)}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Input */}
        <View className="flex-row items-center gap-2 border-t border-gray-100 px-4 py-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            className="h-11 flex-1 rounded-full bg-gray-100 px-4 text-[15px] text-gray-900"
            onSubmitEditing={send}
            returnKeyType="send"
            editable={!!bookingId}
          />
          <Pressable
            onPress={send}
            disabled={!bookingId || sendMessage.isPending}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary"
            style={!bookingId || sendMessage.isPending ? { opacity: 0.5 } : undefined}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
