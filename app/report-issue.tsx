import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
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
import { ISSUE_TYPES } from '@/lib/active-booking/mock';

const DANGER = '#DC2626';

export default function ReportIssue() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  const submit = () => {
    if (!selected) {
      Alert.alert('Select an issue', 'Please choose what went wrong.');
      return;
    }
    Alert.alert(
      'Issue submitted',
      "Thank you. Our team will review it and take appropriate action.",
      [{ text: 'Done', onPress: () => router.back() }],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-center px-5 py-2">
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[17px] font-bold text-gray-900">Report an Issue</Text>
          <Text className="text-[12px] text-gray-500">
            Help us understand what happened
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
        >
          <Text className="mb-2 text-[13px] font-semibold text-gray-700">
            Select the issue type
          </Text>

          {ISSUE_TYPES.map((it) => {
            const active = selected === it.id;
            return (
              <Pressable
                key={it.id}
                onPress={() => setSelected(it.id)}
                className={
                  active
                    ? 'mb-3 flex-row items-center rounded-2xl border-2 p-4'
                    : 'mb-3 flex-row items-center rounded-2xl border border-gray-200 bg-white p-4'
                }
                style={active ? { borderColor: DANGER, backgroundColor: '#FEF2F2' } : undefined}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <Ionicons name={it.icon as keyof typeof Ionicons.glyphMap} size={20} color={DANGER} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[14px] font-bold text-gray-900">{it.title}</Text>
                  <Text className="text-[12px] leading-4 text-gray-500">{it.detail}</Text>
                </View>
                <Ionicons
                  name={active ? 'radio-button-on' : 'chevron-forward'}
                  size={active ? 20 : 18}
                  color={active ? DANGER : colors.textMuted}
                />
              </Pressable>
            );
          })}

          <Text className="mb-1.5 mt-2 text-[13px] font-semibold text-gray-700">
            Additional details (optional)
          </Text>
          <TextInput
            value={details}
            onChangeText={(t) => setDetails(t.slice(0, 500))}
            placeholder="Please share more details about the issue..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            className="min-h-[96px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
          />
          <Text className="mt-1 text-right text-[11px] text-gray-400">
            {details.length}/500
          </Text>

          <View
            className="mt-4 flex-row items-center rounded-2xl p-3"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={DANGER} />
            <Text className="ml-2 flex-1 text-[12px] text-gray-600">
              We take your concerns seriously. Your report is confidential and we’ll
              review it and take appropriate action.
            </Text>
          </View>

          <Pressable
            onPress={submit}
            className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90"
            style={{ backgroundColor: DANGER }}
          >
            <Ionicons name="alert-circle" size={18} color={colors.white} />
            <Text className="text-[16px] font-bold text-white">Submit Issue</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
