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

import { ArtisanRow } from '@/components/active-booking/parts';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useArtisan } from '@/lib/catalogue/hooks';
import { useSubmitReview } from '@/lib/reviews/hooks';

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

export default function ServiceReview() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    artisanId?: string;
    name?: string;
    serviceName?: string;
  }>();

  // Prefer the real artisan profile when we have its id; fall back to the name
  // passed in from the booking while it loads / if absent.
  const { data: artisan } = useArtisan(params.artisanId);
  const name = artisan?.fullName || params.name || 'Your artisan';
  const specialty = artisan?.specialty || 'Artisan';
  const rating = artisan?.rating ?? 0;
  const jobsCount = artisan?.jobsCount || '';
  const imageKey = artisan?.imageKey || '';

  const [overall, setOverall] = useState(5);
  const [text, setText] = useState('');

  const { mutateAsync, isPending } = useSubmitReview();

  const submit = async () => {
    if (!params.bookingId) {
      Alert.alert('Something went wrong', 'This review is missing its booking.');
      return;
    }
    try {
      await mutateAsync({
        bookingId: params.bookingId,
        body: { rating: overall, comment: text.trim() || null },
      });
      Alert.alert('Thank you!', 'Your review has been submitted.', [
        { text: 'Done', onPress: () => router.replace('/bookings') },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not submit review',
        authErrorMessage(err, 'Please try again in a moment.'),
      );
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
          <Text className="text-[17px] font-bold text-gray-900">Review Artisan</Text>
          <Text className="text-[12px] text-gray-500">
            Share your experience and help others
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
          {/* Artisan */}
          <View className="rounded-3xl border border-gray-100 bg-white p-4">
            <ArtisanRow
              name={name}
              specialty={params.serviceName ? `${params.serviceName} • ${specialty}` : specialty}
              rating={rating}
              jobsCount={jobsCount}
              imageKey={imageKey}
              photoUrl={artisan?.photoUrl}
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
            <Button label="Submit Review" onPress={submit} loading={isPending} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
