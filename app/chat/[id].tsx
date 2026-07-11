import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string; name?: string; artisanId?: string }>();
  // The `id` route param is the conversation id (customer↔artisan thread).
  const conversationId = params.id && params.id !== 'demo' ? params.id : undefined;
  const name = params.name || 'Chat';
  // Present only on a customer-side, pre-booking thread → show the "Book" CTA.
  const artisanId = params.artisanId || undefined;

  const [showSafety, setShowSafety] = useState(true);

  const { data: messages, isLoading } = useChatMessages(conversationId);
  const sendMessage = useSendMessage(conversationId ?? '');
  useChatRealtime(conversationId);

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messages?.length) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages?.length]);

  const send = () => {
    const text = draft.trim();
    if (!text || !conversationId || sendMessage.isPending) return;
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
          <Text className="text-[11px] text-gray-400">Servika chat</Text>
        </View>
        {artisanId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Book ${name}`}
            onPress={() =>
              router.push({ pathname: '/artisan/[id]', params: { id: artisanId } })
            }
            className="flex-row items-center gap-1 rounded-full bg-primary px-3.5 py-2"
          >
            <Ionicons name="calendar" size={14} color={colors.white} />
            <Text className="text-[12px] font-bold text-white">Book</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Anti-disintermediation nudge: keep the job (and its protection) on Servika. */}
      {showSafety ? (
        <View className="mx-4 mt-2 flex-row items-start gap-2 rounded-2xl bg-primary/5 px-3 py-2.5">
          <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
          <Text className="flex-1 text-[11px] leading-4 text-gray-600">
            Keep payments and coordination on Servika — you&apos;re covered by escrow,
            reviews and dispute support. Phone numbers and emails are hidden in chat.
          </Text>
          <Pressable hitSlop={8} onPress={() => setShowSafety(false)}>
            <Ionicons name="close" size={15} color={colors.textMuted} />
          </Pressable>
        </View>
      ) : null}

      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
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

        {/* Input — bottom-inset so the Android gesture bar never covers it. */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 8) }}
          className="flex-row items-center gap-2 border-t border-gray-100 px-4 pt-2"
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            className="h-11 flex-1 rounded-full bg-gray-100 px-4 text-[15px] text-gray-900"
            onSubmitEditing={send}
            returnKeyType="send"
            editable={!!conversationId}
          />
          <Pressable
            onPress={send}
            disabled={!conversationId || sendMessage.isPending}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary"
            style={!conversationId || sendMessage.isPending ? { opacity: 0.5 } : undefined}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
