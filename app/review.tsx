import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { ArtisanRow } from '@/components/active-booking/parts';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { MOCK_ARTISAN } from '@/lib/active-booking/mock';

function Stars({
  value,
  onChange,
  size = 22,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} hitSlop={4} onPress={() => onChange(n)}>
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? colors.primary : colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const CATEGORIES = ['Quality of work', 'Punctuality', 'Communication'] as const;

export default function ServiceReview() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; serviceName?: string }>();
  const name = params.name || MOCK_ARTISAN.name;

  const [overall, setOverall] = useState(5);
  const [cats, setCats] = useState<Record<string, number>>({
    'Quality of work': 5,
    Punctuality: 5,
    Communication: 5,
  });
  const [text, setText] = useState('');

  const submit = () => {
    Alert.alert('Thank you!', 'Your review has been submitted.', [
      { text: 'Done', onPress: () => router.replace('/bookings') },
    ]);
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
          <Text className="text-[17px] font-bold text-gray-900">Review Artisan</Text>
          <Text className="text-[12px] text-gray-500">
            Share your experience and help others
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
          {/* Artisan */}
          <View className="rounded-3xl border border-gray-100 bg-white p-4">
            <ArtisanRow
              name={name}
              specialty={MOCK_ARTISAN.specialty}
              rating={MOCK_ARTISAN.rating}
              jobsCount={MOCK_ARTISAN.jobsCount}
              imageKey={MOCK_ARTISAN.imageKey}
            />
          </View>

          {/* Overall */}
          <View className="mt-4 items-center rounded-3xl border border-gray-100 bg-white p-5">
            <Text className="text-[14px] font-bold text-gray-900">Overall Rating</Text>
            <Text className="mt-0.5 text-[12px] text-gray-500">
              How would you rate your experience?
            </Text>
            <View className="mt-3">
              <Stars value={overall} onChange={setOverall} size={34} />
            </View>
            <Text className="mt-2 text-[13px] font-semibold text-primary">
              {RATING_LABELS[overall]}
            </Text>
          </View>

          {/* Categories */}
          <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-4">
            <Text className="mb-1 text-[14px] font-bold text-gray-900">
              Rate your experience
            </Text>
            {CATEGORIES.map((c) => (
              <View
                key={c}
                className="flex-row items-center justify-between border-b border-gray-50 py-2.5 last:border-0"
              >
                <Text className="text-[13px] text-gray-700">{c}</Text>
                <Stars
                  value={cats[c]}
                  onChange={(v) => setCats((prev) => ({ ...prev, [c]: v }))}
                  size={18}
                />
              </View>
            ))}
          </View>

          {/* Write */}
          <View className="mt-4">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">
              Write a review
            </Text>
            <TextInput
              value={text}
              onChangeText={(t) => setText(t.slice(0, 500))}
              placeholder="Write a short review..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              className="min-h-[96px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
            />
            <Text className="mt-1 text-right text-[11px] text-gray-400">
              {text.length}/500
            </Text>
          </View>

          <View className="mt-3">
            <Button label="Submit Review" onPress={submit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
