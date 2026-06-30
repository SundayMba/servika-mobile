import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
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
import { CHAT_MESSAGES, MOCK_ARTISAN, type ChatMessage } from '@/lib/active-booking/mock';
import { artisanAvatar } from '@/lib/catalogue/assets';

function QuickChip({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-full bg-primary/5 px-3 py-2"
    >
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text className="text-[12px] font-semibold text-primary">{label}</Text>
    </Pressable>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const name = params.name || MOCK_ARTISAN.name;
  const avatar = artisanAvatar(MOCK_ARTISAN.imageKey);

  const [messages, setMessages] = useState<ChatMessage[]>(CHAT_MESSAGES);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: String(prev.length + 1), from: 'me', text, time: 'now' },
    ]);
    setDraft('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center border-b border-gray-100 px-4 py-2">
        <Pressable hitSlop={8} onPress={() => router.back()} className="pr-2">
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        {avatar ? (
          <Image
            source={avatar}
            style={{ width: 38, height: 38, borderRadius: 19 }}
            contentFit="cover"
          />
        ) : null}
        <View className="ml-2 flex-1">
          <Text className="text-[15px] font-bold text-gray-900">{name}</Text>
          <View className="flex-row items-center gap-1">
            <View className="h-2 w-2 rounded-full bg-green-500" />
            <Text className="text-[11px] text-gray-500">Online</Text>
          </View>
        </View>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/active-booking/tracking', params: { id: params.id, name } })
          }
        >
          <Text className="text-[12px] font-semibold text-primary">View Tracking</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Tracking banner */}
          <Pressable
            onPress={() =>
              router.push({ pathname: '/active-booking/tracking', params: { id: params.id, name } })
            }
            className="mb-4 flex-row items-center rounded-2xl bg-primary/5 p-3"
          >
            <Ionicons name="navigate-circle" size={20} color={colors.primary} />
            <View className="ml-2 flex-1">
              <Text className="text-[13px] font-bold text-gray-900">Tracking active</Text>
              <Text className="text-[11px] text-gray-500">
                ETA {MOCK_ARTISAN.etaMinutes} min · {MOCK_ARTISAN.distanceKm} km away
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <Text className="mb-3 text-center text-[11px] text-gray-400">Today</Text>

          {messages.map((m) => {
            const mine = m.from === 'me';
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
                    {m.text}
                  </Text>
                </View>
                <Text
                  className={`mt-0.5 text-[10px] text-gray-400 ${mine ? 'text-right' : 'text-left'}`}
                >
                  {m.time}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick actions */}
        <View className="flex-row gap-2 px-4 pb-2">
          <QuickChip
            icon="location-outline"
            label="Share Location"
            onPress={() => {}}
          />
          <QuickChip icon="call-outline" label="Call Artisan" onPress={() => {}} />
          <QuickChip icon="calendar-outline" label="Reschedule" onPress={() => {}} />
        </View>

        {/* Input */}
        <View className="flex-row items-center gap-2 border-t border-gray-100 px-4 py-2">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="add" size={22} color={colors.primary} />
          </View>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            className="h-11 flex-1 rounded-full bg-gray-100 px-4 text-[15px] text-gray-900"
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable
            onPress={send}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary"
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
