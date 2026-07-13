import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { bookingMedia, type AssessmentChoice } from '@/lib/booking/mediaStore';

const MAX_PHOTOS = 4;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // keep the upload sane on mobile data

/** Compress + base64 one picked image (photos only need to be legible). */
async function toBase64(uri: string): Promise<string | null> {
  try {
    const shrunk = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1100 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );
    return shrunk.base64 ?? null;
  } catch {
    return null;
  }
}

/** Read a picked video file into base64 via RN's built-in fetch + FileReader. */
async function videoToBase64(uri: string): Promise<string | null> {
  const res = await fetch(uri);
  const blob = await res.blob();
  if (blob.size > MAX_VIDEO_BYTES) return 'TOO_BIG';
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUri = String(reader.result ?? '');
      const comma = dataUri.indexOf(',');
      resolve(comma >= 0 ? dataUri.slice(comma + 1) : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * Job media + pricing-mode step. Photos give any artisan context; on an OPEN
 * request the customer also chooses how pricing works — "artisan inspects
 * first" (first-come claims) or "price it from my photos/video" (artisans bid
 * and the customer picks an offer). Media is held in the draft store (too big
 * for route params) and uploaded with the booking on the confirm step.
 */
export default function BookingPhotos() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    service?: string;
    artisanId?: string;
    description?: string;
    date?: string;
    time?: string;
    urgency?: string;
    open?: string;
    categorySlug?: string;
  }>();
  const isOpen = params.open === '1' && !params.artisanId;

  const [photos, setPhotos] = useState<{ uri: string; base64: string }[]>([]);
  const [video, setVideo] = useState<{ uri: string; base64: string } | null>(null);
  const [assessment, setAssessment] = useState<AssessmentChoice>('Inspection');
  const [working, setWorking] = useState(false);

  const bidding = isOpen && assessment === 'RemoteQuote';

  const pickPhotos = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach pictures of the issue.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });
    if (result.canceled) return;

    setWorking(true);
    try {
      const added: { uri: string; base64: string }[] = [];
      for (const asset of result.assets) {
        const base64 = await toBase64(asset.uri);
        if (base64) added.push({ uri: asset.uri, base64 });
      }
      setPhotos((prev) => [...prev, ...added].slice(0, MAX_PHOTOS));
    } finally {
      setWorking(false);
    }
  };

  const pickVideo = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission needed', 'Allow media access to attach a clip.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 30,
      quality: 0.5,
    });
    if (result.canceled) return;

    setWorking(true);
    try {
      const base64 = await videoToBase64(result.assets[0].uri);
      if (base64 === 'TOO_BIG') {
        Alert.alert('Clip too large', 'Choose a shorter clip (up to ~30 seconds).');
        return;
      }
      if (!base64) {
        Alert.alert('Could not read the video', 'Try a different clip.');
        return;
      }
      setVideo({ uri: result.assets[0].uri, base64 });
    } finally {
      setWorking(false);
    }
  };

  const handleContinue = () => {
    if (bidding && photos.length === 0 && !video) {
      Alert.alert(
        'Add the job details',
        'For price offers, artisans need at least one photo (or a short clip) of the job.',
      );
      return;
    }
    bookingMedia.setPhotos(photos.map((p) => p.base64), photos.map((p) => p.uri));
    bookingMedia.setVideo(video?.base64 ?? null, video?.uri ?? null);
    bookingMedia.setAssessment(isOpen ? assessment : 'Inspection');
    router.push({
      pathname: '/booking/location',
      params: { ...params, photos: String(photos.length) },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[17px] font-bold text-gray-900">Job Details</Text>
          <Text className="text-[12px] text-gray-500">
            Help the artisan understand the job
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >
        {/* Pricing mode — open requests only */}
        {isOpen ? (
          <View className="mb-5">
            <Text className="mb-2.5 text-[15px] font-bold text-gray-900">
              How should pricing work?
            </Text>
            {(
              [
                {
                  key: 'Inspection' as const,
                  icon: 'walk-outline' as const,
                  title: 'Artisan inspects first',
                  sub: 'An artisan comes over, checks the job and discusses the price with you.',
                },
                {
                  key: 'RemoteQuote' as const,
                  icon: 'pricetags-outline' as const,
                  title: 'Get price offers now',
                  sub: 'Artisans price the job from your photos/video and send offers — you pick one.',
                },
              ]
            ).map((opt) => {
              const on = assessment === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setAssessment(opt.key)}
                  className={`mb-2.5 flex-row items-center gap-3 rounded-2xl border-2 bg-white p-4 ${on ? 'border-primary' : 'border-gray-100'}`}
                >
                  <View
                    className={`h-11 w-11 items-center justify-center rounded-xl ${on ? 'bg-primary' : 'bg-background'}`}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={on ? colors.white : colors.textMuted}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-gray-900">{opt.title}</Text>
                    <Text className="mt-0.5 text-[12px] leading-4 text-gray-500">{opt.sub}</Text>
                  </View>
                  <View
                    className={
                      on
                        ? 'h-5 w-5 items-center justify-center rounded-full border-[6px] border-primary'
                        : 'h-5 w-5 rounded-full border-2 border-gray-300'
                    }
                  />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* Upload dropzone */}
        <Pressable
          accessibilityRole="button"
          onPress={pickPhotos}
          disabled={photos.length >= MAX_PHOTOS || working}
          className="items-center rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-8 active:opacity-90"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            {working ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
            )}
          </View>
          <Text className="mt-3 text-[15px] font-bold text-gray-900">
            {bidding ? 'Add job photos (required)' : 'Upload photos'}
          </Text>
          <Text className="mt-1 text-[13px] text-gray-500">
            Tap to choose from your library · up to {MAX_PHOTOS}
          </Text>
        </Pressable>

        {/* Thumbnails */}
        {photos.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap gap-3">
            {photos.map((p) => (
              <View key={p.uri} className="relative">
                <Image
                  source={{ uri: p.uri }}
                  style={{ width: 92, height: 92, borderRadius: 16 }}
                  contentFit="cover"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  hitSlop={6}
                  onPress={() => setPhotos((prev) => prev.filter((x) => x.uri !== p.uri))}
                  className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-white shadow"
                  style={{ elevation: 3 }}
                >
                  <Ionicons name="close" size={15} color={colors.textPrimary} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Short video clip */}
        <Pressable
          accessibilityRole="button"
          onPress={video ? () => setVideo(null) : pickVideo}
          disabled={working}
          className="mt-4 flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 active:opacity-80"
        >
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Ionicons
              name={video ? 'videocam' : 'videocam-outline'}
              size={20}
              color={colors.primary}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-gray-900">
              {video ? 'Video clip attached' : 'Add a short video (optional)'}
            </Text>
            <Text className="mt-0.5 text-[12px] text-gray-500">
              {video
                ? 'Tap to remove it'
                : 'A quick walk-around clip gives artisans the full picture'}
            </Text>
          </View>
          <Ionicons
            name={video ? 'trash-outline' : 'add-circle-outline'}
            size={20}
            color={video ? '#EF4444' : colors.primary}
          />
        </Pressable>

        {/* Tips */}
        <View className="mt-5 flex-row rounded-2xl bg-primary/5 p-4">
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <View className="ml-2 flex-1">
            <Text className="text-[13px] font-bold text-gray-900">Tips</Text>
            <Text className="mt-0.5 text-[12px] leading-4 text-gray-600">
              {bidding
                ? 'Clear photos and a short clip get you more (and more accurate) price offers.'
                : 'Clear photos help artisans understand the problem better and give more accurate quotes.'}
            </Text>
          </View>
        </View>

        {/* Continue */}
        <View className="mt-7">
          <Button
            label={
              photos.length > 0 || video
                ? 'Continue'
                : bidding
                  ? 'Continue'
                  : 'Skip for now'
            }
            variant={photos.length > 0 || video ? 'primary' : bidding ? 'primary' : 'outline'}
            onPress={handleContinue}
            disabled={working}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
