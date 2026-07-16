import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { ISSUE_TYPES } from '@/lib/active-booking/mock';
import { authErrorMessage } from '@/lib/api/auth';
import { useRaiseDispute } from '@/lib/disputes/hooks';

const DANGER = '#DC2626';

export default function ReportIssue() {
  const router = useRouter();
  // Reached from the booking detail / active-booking screens with the real booking
  // id — that's when the report becomes a real dispute. Without one (a mock
  // scaffold), it degrades to the informational confirmation.
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState('');

  const raiseDispute = useRaiseDispute(bookingId ?? '');

  const submit = async () => {
    if (!selected) {
      Alert.alert('Select an issue', 'Please choose what went wrong.');
      return;
    }

    if (!bookingId) {
      // A dispute must be tied to a booking — never pretend one was filed.
      Alert.alert(
        'Open the booking first',
        'To report an issue, open the booking it concerns and tap "Report an issue" there.',
        [
          { text: 'My bookings', onPress: () => router.replace('/bookings') },
          { text: 'Close', style: 'cancel' },
        ],
      );
      return;
    }

    const issue = ISSUE_TYPES.find((it) => it.id === selected);
    // The backend requires a description; fall back to the issue's summary.
    const fallback = issue ? issue.detail : 'Reported issue';
    const description = details.trim() || fallback;

    try {
      await raiseDispute.mutateAsync({ category: selected, description });
      Alert.alert(
        'Issue reported',
        'Thank you. Our team will review your dispute and get back to you.',
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert('Could not submit', authErrorMessage(e, 'Please try again.'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
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
        behavior="padding"
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
            disabled={raiseDispute.isPending}
            className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90"
            style={{ backgroundColor: DANGER, opacity: raiseDispute.isPending ? 0.6 : 1 }}
          >
            <Ionicons name="alert-circle" size={18} color={colors.white} />
            <Text className="text-[16px] font-bold text-white">
              {raiseDispute.isPending ? 'Submitting…' : 'Submit Issue'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
