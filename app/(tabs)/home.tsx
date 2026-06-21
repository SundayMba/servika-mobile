import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { SearchSheet } from '@/components/SearchSheet';
import { ArtisanCard } from '@/components/home/ArtisanCard';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { ServiceTile } from '@/components/home/ServiceTile';
import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { artisanAvatar, categoryImage } from '@/lib/catalogue/assets';
import { useCategories, useNearbyArtisans } from '@/lib/catalogue/hooks';

// Approx. height of the custom bottom tab bar (excluding the safe-area inset,
// which we add separately) so scroll content clears it.
const TAB_BAR_HEIGHT = 60;

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="mb-3.5 flex-row items-center justify-between">
      <Text className="text-[17px] font-bold text-gray-900">{title}</Text>
      <TouchableOpacity hitSlop={8}>
        <Text className="text-[13px] font-semibold text-primary">View all</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Compact loading spinner / error message for an async section. */
function SectionState({
  loading,
  error,
}: {
  loading: boolean;
  error?: boolean;
}) {
  return (
    <View className="items-center justify-center py-6">
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text className="text-[13px] text-gray-400">
          {error ? "Couldn't load — pull to retry." : 'Nothing here yet.'}
        </Text>
      )}
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 25;

  const [searchVisible, setSearchVisible] = useState(false);
  const { user } = useAuth();
  const { isAuthenticated, guard, promptVisible, hidePrompt } = useAuthGate();

  // Greet the signed-in user by first name; guests see "Guest".
  const firstName = user?.fullName.trim().split(/\s+/)[0] || 'Guest';

  const categoriesQuery = useCategories();
  const artisansQuery = useNearbyArtisans();

  // Home shows only the "popular" subset of the catalogue.
  const popularServices = useMemo(
    () => (categoriesQuery.data ?? []).filter((c) => c.isPopular),
    [categoriesQuery.data],
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* ── Fixed header (stays pinned while the body scrolls) ── */}
      <View className="flex-row items-center justify-between bg-background px-5 pb-4 pt-2">
        <View>
          <Text className="text-[22px] font-bold text-gray-900">
            Good morning, {firstName} 👋
          </Text>
          <Text className="mt-0.5 text-[13px] text-gray-500">
            What needs fixing today?
          </Text>
        </View>
        <TouchableOpacity
          accessibilityLabel="Notifications"
          className="h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={colors.textPrimary}
          />
          <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-red-500" />
        </TouchableOpacity>
      </View>

      {/* ── Fixed search bar (stays pinned while the body scrolls) ── */}
      <TouchableOpacity
        activeOpacity={0.7}
        accessibilityRole="search"
        onPress={() => setSearchVisible(true)}
        className="mx-5 mb-4 h-14 flex-row items-center gap-2.5 rounded-2xl border border-gray-100/70 bg-white px-4"
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <Text className="text-[14px] text-gray-400">
          Search services, artisans...
        </Text>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {/* ── Emergency hero (rotating working artisans) ── */}
        <View className="mb-4 px-5">
          <HeroCarousel />
        </View>

        {/* ── Popular Services (wrapped in a white card) ── */}
        <View className="mb-4 px-5">
          <View className="rounded-3xl border border-gray-100/70 bg-white px-4 pb-5 pt-4">
            <SectionHeader title="Popular Services" />
            {popularServices.length === 0 ? (
              <SectionState
                loading={categoriesQuery.isLoading}
                error={categoriesQuery.isError}
              />
            ) : (
              <View className="flex-row flex-wrap" style={{ rowGap: 20 }}>
                {popularServices.map((category) => (
                  <ServiceTile
                    key={category.id}
                    service={{
                      label: category.name,
                      image: categoryImage(category.slug),
                    }}
                    onPress={() =>
                      router.push({
                        pathname: '/category/[id]',
                        params: { id: category.slug },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Nearby Artisans ── */}
        <View className="mb-4">
          <View className="px-5">
            <SectionHeader title="Nearby Artisans" />
          </View>
          {(artisansQuery.data?.length ?? 0) === 0 ? (
            <View className="px-5">
              <SectionState
                loading={artisansQuery.isLoading}
                error={artisansQuery.isError}
              />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {artisansQuery.data?.map((artisan) => (
                <ArtisanCard
                  key={artisan.id}
                  artisan={{
                    name: artisan.fullName,
                    specialty: artisan.specialty,
                    available: artisan.isAvailable,
                    rating: artisan.rating,
                    distanceKm: artisan.distanceKm,
                    avatar: artisanAvatar(artisan.imageKey),
                  }}
                  onPress={() =>
                    router.push({
                      pathname: '/artisan/[id]',
                      params: { id: artisan.id },
                    })
                  }
                  onBook={() =>
                    guard(() =>
                      router.push({
                        pathname: '/booking/request',
                        params: { service: artisan.specialty, artisanId: artisan.id },
                      }),
                    )
                  }
                  onChat={() => guard(() => router.push('/messages'))}
                  chatLocked={!isAuthenticated}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── "Browsing as Guest" banner — only for guests ── */}
        {!isAuthenticated ? (
          <View className="mx-5">
            <View
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.01,
                shadowRadius: 1,
                shadowOffset: { width: 0, height: 10 },
                elevation: 0.5,
              }}
              className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-5"
            >
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons
                    name="person-circle-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text className="text-[13px] font-semibold text-gray-900">
                    Browsing as Guest
                  </Text>
                </View>
                <Text className="mt-0.5 text-[10px] text-gray-500">
                  Sign up to book services and track your jobs
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sign up"
                onPress={() => router.push('/register')}
                style={{
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 5,
                }}
                className="rounded-xl bg-primary px-5 py-2.5"
              >
                <Text className="text-[13px] font-bold text-white">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Search (open to guests) ── */}
      <SearchSheet
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />

      {/* ── Booking & chat are gated behind sign-in ── */}
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
