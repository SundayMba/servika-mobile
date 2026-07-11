import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { SearchSheet } from '@/components/SearchSheet';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { artisanPhotoSource } from '@/lib/catalogue/assets';
import { useCategories, useCategoryArtisans } from '@/lib/catalogue/hooks';
import type { ArtisanSummary } from '@/lib/catalogue/types';

function ArtisanRow({
  artisan,
  onPress,
}: {
  artisan: ArtisanSummary;
  onPress: () => void;
}) {
  const avatar = artisanPhotoSource(artisan.photoUrl, artisan.imageKey);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${artisan.fullName}, ${artisan.specialty}`}
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl border border-gray-100/70 bg-white p-3 active:opacity-80"
    >
      <View className="h-16 w-16 overflow-hidden rounded-xl bg-background">
        {avatar ? (
          <Image source={avatar} contentFit="cover" style={{ flex: 1 }} />
        ) : null}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[15px] font-bold text-gray-900">{artisan.fullName}</Text>
          {artisan.isAvailable ? (
            <View className="h-2 w-2 rounded-full bg-green-500" />
          ) : null}
        </View>
        <Text numberOfLines={1} className="mt-0.5 text-[12px] text-gray-500">
          {artisan.specialty}
        </Text>
        <View className="mt-1 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text className="text-[12px] font-semibold text-gray-700">
              {artisan.rating.toFixed(1)}
            </Text>
          </View>
          <View className="flex-row items-center gap-0.5">
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text className="text-[12px] text-gray-500">{artisan.distanceKm} km</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function CategoryListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [searchVisible, setSearchVisible] = useState(false);
  const { guard, promptVisible, hidePrompt } = useAuthGate();

  const { data: categories, isLoading } = useCategories();
  const category = categories?.find((c) => c.slug === id);
  const { data: artisans, isLoading: loadingArtisans } = useCategoryArtisans(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-[16px] font-semibold text-gray-900">
          Category not found
        </Text>
        <Pressable hitSlop={8} className="mt-3" onPress={() => router.back()}>
          <Text className="text-[14px] font-bold text-primary">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

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
        <Text className="text-[17px] font-bold text-gray-900">{category.name}</Text>
      </View>

      {/* Search */}
      <Pressable
        accessibilityRole="search"
        onPress={() => setSearchVisible(true)}
        className="mx-5 mb-3 mt-1 h-12 flex-row items-center gap-2.5 rounded-2xl border border-gray-100/70 bg-white px-4"
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <Text className="flex-1 text-[14px] text-gray-400">
          Search artisans &amp; services...
        </Text>
      </Pressable>

      {/* Artisan listing */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 12 }}
      >
        {/* Post an open request — matched with the first available pro. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Post an open ${category.name} request`}
          onPress={() =>
            guard(() =>
              router.push({
                pathname: '/booking/request',
                params: { categorySlug: id, open: '1', service: category.name },
              }),
            )
          }
          className="mb-4 flex-row items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 active:opacity-80"
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name="megaphone-outline" size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-bold text-gray-900">
              Not sure who to pick?
            </Text>
            <Text className="text-[12px] leading-4 text-gray-500">
              Post a request — the first available {category.name.toLowerCase()} pro takes it.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>

        <Text className="mb-3 text-[13px] font-semibold text-gray-500">
          {loadingArtisans
            ? 'Finding artisans…'
            : `${artisans?.length ?? 0} artisan${(artisans?.length ?? 0) === 1 ? '' : 's'} available`}
        </Text>

        {loadingArtisans ? (
          <ActivityIndicator color={colors.primary} className="mt-6" />
        ) : !artisans?.length ? (
          <View className="mt-10 items-center px-8">
            <Ionicons name="people-outline" size={44} color={colors.textMuted} />
            <Text className="mt-3 text-center text-[15px] font-semibold text-gray-800">
              No artisans yet
            </Text>
            <Text className="mt-1 text-center text-[13px] leading-5 text-gray-500">
              We&apos;re onboarding {category.name.toLowerCase()} pros in your area. Check back soon.
            </Text>
          </View>
        ) : (
          artisans.map((artisan) => (
            <ArtisanRow
              key={artisan.id}
              artisan={artisan}
              onPress={() =>
                router.push({ pathname: '/artisan/[id]', params: { id: artisan.id } })
              }
            />
          ))
        )}
      </ScrollView>

      {/* Search (open to guests) */}
      <SearchSheet visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <AuthPromptSheet
        visible={promptVisible}
        onClose={hidePrompt}
        title="Sign up to continue"
        message="Create an account to post a request and get matched with a pro."
        onSignUp={() => {
          hidePrompt();
          router.push('/register');
        }}
        onLogin={() => {
          hidePrompt();
          router.push('/login');
        }}
      />
    </SafeAreaView>
  );
}
