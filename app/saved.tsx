import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { artisanPhotoSource } from '@/lib/catalogue/assets';
import type { ArtisanSummary } from '@/lib/catalogue/types';
import { useFavorites } from '@/lib/favorites/hooks';

function SavedRow({ artisan, onPress }: { artisan: ArtisanSummary; onPress: () => void }) {
  const avatar = artisanPhotoSource(artisan.photoUrl, artisan.imageKey);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl border border-gray-100/70 bg-white p-3 active:opacity-80"
    >
      <View className="h-16 w-16 overflow-hidden rounded-xl bg-background">
        {avatar ? <Image source={avatar} contentFit="cover" style={{ flex: 1 }} /> : null}
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-gray-900">{artisan.fullName}</Text>
        <Text numberOfLines={1} className="mt-0.5 text-[12px] text-gray-500">
          {artisan.specialty}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text className="text-[12px] font-semibold text-gray-700">
            {artisan.rating.toFixed(1)}
          </Text>
          <Text className="text-[12px] text-gray-400">· {artisan.distanceKm} km</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function SavedArtisans() {
  const router = useRouter();
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const { data, isLoading } = useFavorites({ enabled: signedIn });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text className="ml-2 text-[20px] font-bold text-gray-900">Saved Artisans</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !data?.length ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="heart-outline" size={44} color={colors.textMuted} />
          <Text className="mt-3 text-center text-[16px] font-semibold text-gray-800">
            No saved artisans yet
          </Text>
          <Text className="mt-1 text-center text-[13px] leading-5 text-gray-500">
            Tap the heart on an artisan&apos;s profile to save them for quick access.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/artisans')}
            className="mt-5 h-12 items-center justify-center rounded-2xl bg-primary px-6"
          >
            <Text className="text-[15px] font-bold text-white">Browse artisans</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 12 }}
        >
          {data.map((artisan) => (
            <SavedRow
              key={artisan.id}
              artisan={artisan}
              onPress={() =>
                router.push({ pathname: '/artisan/[id]', params: { id: artisan.id } })
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
