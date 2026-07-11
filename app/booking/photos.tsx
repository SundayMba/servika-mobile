import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';

const MAX_PHOTOS = 6;

export default function BookingPhotos() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    service?: string;
    artisanId?: string;
    description?: string;
    date?: string;
    time?: string;
    urgency?: string;
  }>();

  const [photos, setPhotos] = useState<string[]>([]);

  const pickPhotos = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo access to attach pictures of the issue.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (uri: string) =>
    setPhotos((prev) => prev.filter((p) => p !== uri));

  const handleContinue = () => {
    router.push({
      pathname: '/booking/location',
      // Photos are local URIs for now (no storage backend yet) — threaded so the
      // summary can show how many are attached. They're not sent to the API until
      // the media-upload slice lands.
      params: { ...params, photos: JSON.stringify(photos) },
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
          <Text className="text-[17px] font-bold text-gray-900">Add Photos</Text>
          <Text className="text-[12px] text-gray-500">
            Help the artisan understand the job
          </Text>
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
          disabled={photos.length >= MAX_PHOTOS}
          className="items-center rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-10 active:opacity-90"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
          </View>
          <Text className="mt-3 text-[15px] font-bold text-gray-900">
            Upload photos
          </Text>
          <Text className="mt-1 text-[13px] text-gray-500">
            Tap to choose from your library
          </Text>
          <Text className="mt-0.5 text-[12px] text-gray-400">
            PNG, JPG up to 10MB each
          </Text>
        </Pressable>

        {/* Thumbnails */}
        {photos.length > 0 ? (
          <View className="mt-4 flex-row flex-wrap gap-3">
            {photos.map((uri) => (
              <View key={uri} className="relative">
                <Image
                  source={{ uri }}
                  style={{ width: 92, height: 92, borderRadius: 16 }}
                  contentFit="cover"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  hitSlop={6}
                  onPress={() => removePhoto(uri)}
                  className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-white shadow"
                  style={{ elevation: 3 }}
                >
                  <Ionicons name="close" size={15} color={colors.textPrimary} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Tips */}
        <View className="mt-5 flex-row rounded-2xl bg-primary/5 p-4">
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <View className="ml-2 flex-1">
            <Text className="text-[13px] font-bold text-gray-900">Tips</Text>
            <Text className="mt-0.5 text-[12px] leading-4 text-gray-600">
              Clear photos help artisans understand the problem better and give
              more accurate quotes.
            </Text>
          </View>
        </View>

        {/* Continue (photos are optional) */}
        <View className="mt-7">
          <Button
            label={photos.length > 0 ? 'Continue' : 'Skip for now'}
            variant={photos.length > 0 ? 'primary' : 'outline'}
            onPress={handleContinue}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
