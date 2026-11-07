import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { appAlert } from '@/components/ui/AppAlert';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/FieldError';
import { colors } from '@/constants/colors';
import { bookingMedia, type AssessmentChoice } from '@/lib/booking/mediaStore';

const MAX_PHOTOS = 4;
// 8 MB, not 25. The clip is base64'd into the create-booking JSON, so 25 MB
// became a ~33 MB string plus copies from JSON.stringify and axios — on the
// order of 100 MB of transient allocation on a phone that may not have it, and
// a third more mobile data than the file itself. 8 MB comfortably holds the
// 30-second clip the picker is already limited to.
const MAX_VIDEO_BYTES = 8 * 1024 * 1024;

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

/** Byte size of a picked file, without reading its contents into the heap.
 *  The picker reports `fileSize` on most assets; the blob is a native handle,
 *  so falling back to it costs a stat, not a copy. */
async function fileSize(uri: string, reported?: number | null): Promise<number | null> {
  if (typeof reported === 'number' && reported > 0) return reported;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    return blob.size;
  } catch {
    return null;
  }
}

/**
 * Job media step. On an open request, artisans price the job from these photos (or offer to
 * visit first), so good photos mean better prices. Media is held in the draft store (too big for
 * route params) and uploaded with the booking on the confirm step.
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

  // Seeded from the draft, so photos stay put when the customer comes back to this step.
  const [photos, setPhotos] = useState<{ uri: string; base64: string }[]>(() => {
    const d = bookingMedia.get();
    return d.photoUris.map((uri, i) => ({ uri, base64: d.photosBase64[i] ?? '' })).filter((p) => p.base64);
  });

  const [mediaErr] = useState<string | undefined>();
  const [video, setVideo] = useState<{ uri: string } | null>(() => {
    const uri = bookingMedia.get().videoUri;
    return uri ? { uri } : null;
  });
  // Kept in the draft as they change, so going back a step does not lose them either.
  useEffect(() => {
    bookingMedia.setPhotos(photos.map((p) => p.base64), photos.map((p) => p.uri));
    bookingMedia.setVideo(video?.uri ?? null);
  }, [photos, video]);
  // An open request is priced by bids; a request to one artisan is seen and priced by them.
  const assessment: AssessmentChoice = isOpen ? 'RemoteQuote' : 'Inspection';
  const [working, setWorking] = useState(false);

  // Photos are optional even when artisans bid: some will offer to visit first instead.
  const bidding = isOpen;

  const pickPhotos = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      appAlert('Permission needed', 'Allow photo access to attach pictures of the issue.');
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
      appAlert('Permission needed', 'Allow media access to attach a clip.');
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
      const asset = result.assets[0];
      const size = await fileSize(asset.uri, asset.fileSize);
      if (size === null) {
        appAlert('Could not read the video', 'Try a different clip.');
        return;
      }
      if (size > MAX_VIDEO_BYTES) {
        appAlert('Clip too large', 'Choose a shorter clip (up to ~30 seconds).');
        return;
      }
      // Only the URI is kept. It is encoded once, at submit — see mediaStore.
      setVideo({ uri: asset.uri });
    } finally {
      setWorking(false);
    }
  };

  const handleContinue = () => {
    bookingMedia.setPhotos(photos.map((p) => p.base64), photos.map((p) => p.uri));
    bookingMedia.setVideo(video?.uri ?? null);
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
          <AppText weight="semibold" className="text-[17px] text-gray-900">Job Details</AppText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
      >

        {/* Upload dropzone */}
        <Pressable
          accessibilityRole="button"
          onPress={pickPhotos}
          disabled={photos.length >= MAX_PHOTOS || working}
          className={`items-center rounded-3xl border-2 border-dashed bg-white px-6 py-8 active:opacity-90 ${mediaErr && photos.length === 0 && !video ? 'border-red-400' : 'border-gray-200'}`}
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            {working ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
            )}
          </View>
          <AppText weight="semibold" className="mt-3 text-[15px] text-gray-900">
            {bidding ? 'Add photos of the job' : 'Upload photos'}
          </AppText>
          <AppText className="mt-1 text-[13px] text-gray-500">
            Up to {MAX_PHOTOS} photos
          </AppText>
        </Pressable>
        <FieldError text={mediaErr && photos.length === 0 && !video ? mediaErr : undefined} />

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
            <AppText weight="semibold" className="text-[14px] text-gray-900">
              {video ? 'Video clip attached' : 'Add a short video (optional)'}
            </AppText>
            <AppText className="mt-0.5 text-[12px] text-gray-500">
              {video
                ? 'Tap to remove it'
                : 'Up to about 30 seconds'}
            </AppText>
          </View>
          <Ionicons
            name={video ? 'trash-outline' : 'add-circle-outline'}
            size={20}
            color={video ? '#EF4444' : colors.primary}
          />
        </Pressable>

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
