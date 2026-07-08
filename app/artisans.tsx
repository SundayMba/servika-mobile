import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { SearchSheet } from '@/components/SearchSheet';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { artisanAvatar } from '@/lib/catalogue/assets';
import type { ArtisanSummary } from '@/lib/catalogue/types';
import { useNearbyArtisans } from '@/lib/catalogue/hooks';
import { useOpenChat } from '@/lib/chat/hooks';

/** Full-width artisan row for the vertical listing (the carousel card is compact). */
function ArtisanRow({
  artisan,
  onPress,
  onBook,
  onChat,
  chatLocked,
}: {
  artisan: ArtisanSummary;
  onPress: () => void;
  onBook: () => void;
  onChat: () => void;
  chatLocked: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${artisan.fullName}, ${artisan.specialty}`}
      onPress={onPress}
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
      className="mb-3 rounded-2xl border border-gray-100/70 bg-white p-3 active:opacity-90"
    >
      <View className="flex-row gap-3">
        <View className="h-20 w-20 overflow-hidden rounded-xl bg-background">
          <Image
            source={artisanAvatar(artisan.imageKey)}
            contentFit="cover"
            contentPosition="top"
            style={{ flex: 1 }}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text
              numberOfLines={1}
              className="flex-shrink text-[15px] font-bold text-gray-900"
            >
              {artisan.fullName}
            </Text>
            <MaterialCommunityIcons name="check-decagram" size={15} color="#3B82F6" />
          </View>

          <Text numberOfLines={1} className="mt-0.5 text-[12px] font-medium text-primary">
            {artisan.specialty}
          </Text>

          <View className="mt-1.5 flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={13} color="#FBBF24" />
              <Text className="text-[12px] font-semibold text-gray-700">
                {artisan.rating.toFixed(1)}
              </Text>
              <Text className="text-[12px] text-gray-400">({artisan.reviewCount})</Text>
            </View>
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text className="text-[12px] text-gray-500">{artisan.distanceKm} km</Text>
            </View>
          </View>

          <View className="mt-1.5 flex-row items-center gap-1">
            <View
              className={
                artisan.isAvailable
                  ? 'h-1.5 w-1.5 rounded-full bg-green-500'
                  : 'h-1.5 w-1.5 rounded-full bg-gray-300'
              }
            />
            <Text
              className={
                artisan.isAvailable
                  ? 'text-[11px] font-semibold text-green-600'
                  : 'text-[11px] font-semibold text-gray-400'
              }
            >
              {artisan.isAvailable ? 'Available now' : 'Busy'}
            </Text>
          </View>
        </View>
      </View>

      {/* Book Now + Chat */}
      <View className="mt-3 flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Book ${artisan.fullName}`}
          onPress={onBook}
          className="h-10 flex-1 flex-row items-center justify-center rounded-xl bg-primary"
        >
          <Text className="text-[13px] font-bold text-white">Book Now</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            chatLocked
              ? `Chat with ${artisan.fullName} — sign in required`
              : `Chat with ${artisan.fullName}`
          }
          onPress={onChat}
          className="relative h-10 flex-row items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.primary} />
          <Text className="text-[13px] font-bold text-primary">Chat</Text>
          {chatLocked ? (
            <View className="absolute -right-1.5 -top-1.5 h-4 w-4 items-center justify-center rounded-full border border-white bg-gray-400">
              <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
            </View>
          ) : null}
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function ArtisansList() {
  const router = useRouter();
  const [searchVisible, setSearchVisible] = useState(false);

  const { isAuthenticated, guard, promptVisible, hidePrompt } = useAuthGate();
  const { openWithArtisan } = useOpenChat();
  const artisansQuery = useNearbyArtisans();
  const artisans = artisansQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
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
        <Text className="text-[17px] font-bold text-gray-900">Nearby Artisans</Text>
      </View>

      {/* Search */}
      <Pressable
        accessibilityRole="search"
        onPress={() => setSearchVisible(true)}
        className="mx-5 mb-3 mt-1 h-12 flex-row items-center gap-2.5 rounded-2xl border border-gray-100/70 bg-white px-4"
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <Text className="flex-1 text-[14px] text-gray-400">Search artisans...</Text>
        <Ionicons name="options-outline" size={18} color={colors.primary} />
      </Pressable>

      {artisans.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          {artisansQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text className="text-[13px] text-gray-400">
              {artisansQuery.isError
                ? "Couldn't load artisans — pull to retry."
                : 'No artisans available yet.'}
            </Text>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        >
          {artisans.map((artisan) => (
            <ArtisanRow
              key={artisan.id}
              artisan={artisan}
              chatLocked={!isAuthenticated}
              onPress={() =>
                router.push({ pathname: '/artisan/[id]', params: { id: artisan.id } })
              }
              onBook={() =>
                guard(() =>
                  router.push({
                    pathname: '/booking/request',
                    params: { service: artisan.specialty, artisanId: artisan.id },
                  }),
                )
              }
              onChat={() =>
                guard(() => openWithArtisan(artisan.id, artisan.fullName))
              }
            />
          ))}
        </ScrollView>
      )}

      <SearchSheet visible={searchVisible} onClose={() => setSearchVisible(false)} />

      <AuthPromptSheet
        visible={promptVisible}
        onClose={hidePrompt}
        title="Sign in to continue"
        message="Create an account or log in to book services and message artisans."
        icon="lock-closed"
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
