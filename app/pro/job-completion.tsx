import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProHeader } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useArtisanJob, useSubmitJobCompletion } from '@/lib/artisan/jobHooks';

const MAX_PHOTOS = 4;
type Shot = { uri: string; base64: string };

async function pickPhoto(fromCamera: boolean): Promise<Shot | null> {
  const perm = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', 'Allow access to add a photo of the work.');
    return null;
  }
  const res = fromCamera
    ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true });
  if (res.canceled) return null;
  const asset = res.assets[0];
  try {
    const shrunk = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1000 } }],
      { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return { uri: shrunk.uri, base64: shrunk.base64 ?? asset.base64 ?? '' };
  } catch {
    return { uri: asset.uri, base64: asset.base64 ?? '' };
  }
}

/**
 * Artisan marks a job done: capture proof-of-work photos (required) + an optional
 * note, then submit → the booking goes AwaitingConfirmation and the customer is
 * asked to review & confirm (auto-confirms after the window if they don't). Once
 * submitted, this screen shows the "awaiting confirmation" state.
 */
export default function JobCompletion() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading } = useArtisanJob(id);
  const submit = useSubmitJobCompletion();

  const [photos, setPhotos] = useState<Shot[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !job) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const alreadySubmitted =
    job.status === 'AwaitingConfirmation' || job.status === 'Completed';

  const addPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const shot = await pickPhoto(true);
    if (shot?.base64) setPhotos((p) => [...p, shot].slice(0, MAX_PHOTOS));
  };

  const onSubmit = async () => {
    setError(null);
    if (photos.length === 0) {
      setError('Add at least one photo of the completed work.');
      return;
    }
    try {
      await submit.mutateAsync({
        id: job.id,
        body: { note: note.trim() || null, photosBase64: photos.map((p) => p.base64) },
      });
      // Screen re-renders in the "awaiting confirmation" state (status changed).
    } catch (e) {
      const kb = Math.round(photos.reduce((s, p) => s + p.base64.length, 0) / 1024);
      const err = e as { response?: { status?: number }; code?: string };
      const status = err?.response?.status ?? err?.code ?? 'no-response';
      setError(
        `${authErrorMessage(e, 'Could not submit.')}\n[debug: ${status} · ${photos.length} photo(s) ~${kb}KB]`,
      );
    }
  };

  // ── Already submitted → awaiting / completed state ──
  if (alreadySubmitted) {
    const done = job.status === 'Completed';
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ProHeader title="Job Completed" />
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: done ? '#16A34A' : '#FFEDD5' }}
          >
            <Ionicons
              name={done ? 'checkmark' : 'time-outline'}
              size={44}
              color={done ? colors.white : colors.primary}
            />
          </View>
          <Text className="mt-4 text-center text-[22px] font-extrabold text-gray-900">
            {done ? 'Job complete!' : 'Submitted for confirmation'}
          </Text>
          <Text className="mt-2 text-center text-[14px] leading-5 text-gray-500">
            {done
              ? 'The customer confirmed the work. Nice job!'
              : 'The customer will review your photos and confirm. If they don’t respond within 48 hours, it confirms automatically.'}
          </Text>
        </View>
        <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white">
          <View className="px-5 py-3">
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/pro/dashboard')}
              className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
            >
              <Text className="text-[15px] font-bold text-white">Back to Dashboard</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    );
  }

  // ── Submission form (InProgress) ──
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ProHeader title="Complete Job" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      >
        <Text className="text-[20px] font-extrabold text-gray-900">
          Show the finished work
        </Text>
        <Text className="mb-5 mt-1 text-[13px] leading-5 text-gray-500">
          Add clear photos of the completed {job.serviceName.toLowerCase()}. The
          customer reviews these to confirm and release your payout.
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {photos.map((p, i) => (
            <View key={i} className="relative">
              <Image source={{ uri: p.uri }} style={{ width: 96, height: 96, borderRadius: 14 }} contentFit="cover" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-gray-900"
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              onPress={addPhoto}
              className="h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-background"
            >
              <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
              <Text className="mt-1 text-[11px] text-gray-400">Add photo</Text>
            </Pressable>
          ) : null}
        </View>

        <Text className="mb-1.5 mt-6 text-[12px] font-medium text-gray-500">
          Note for the customer (optional)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Replaced the faulty socket and tested all outlets."
          placeholderTextColor={colors.textMuted}
          multiline
          className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900"
          style={{ minHeight: 88, textAlignVertical: 'top' }}
        />

        {error ? (
          <Text className="mt-3 text-[13px] font-medium text-red-500">{error}</Text>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="border-t border-gray-100 bg-white">
        <View className="px-5 py-3">
          <Pressable
            accessibilityRole="button"
            disabled={submit.isPending}
            onPress={onSubmit}
            className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
            style={submit.isPending ? { opacity: 0.6 } : undefined}
          >
            <Text className="text-[15px] font-bold text-white">
              {submit.isPending ? 'Submitting…' : 'Submit for confirmation'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
