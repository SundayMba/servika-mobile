import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { getArtisanById } from '@/constants/home-data';

function InfoChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2">
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text className="text-[12px] font-medium text-gray-600">{label}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-3 text-[16px] font-bold text-gray-900">{title}</Text>
  );
}

export default function ArtisanProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [authPromptVisible, setAuthPromptVisible] = useState(false);

  const artisan = getArtisanById(id);

  if (!artisan) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-[16px] font-semibold text-gray-900">
          Artisan not found
        </Text>
        <Pressable hitSlop={8} className="mt-3" onPress={() => router.back()}>
          <Text className="text-[14px] font-bold text-primary">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Cover photo */}
        <View className="h-72 w-full bg-background">
          <Image
            source={artisan.cover}
            contentFit="cover"
            contentPosition="top"
            style={{ flex: 1 }}
          />
        </View>

        {/* White sheet with the avatar overlapping the cover */}
        <View className="-mt-7 rounded-t-[36px] bg-white">
          {/* Identity */}
          <View className="-mt-14 items-center px-5">
            <View
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
              className="rounded-full border-4 border-white bg-white"
            >
              <View className="h-28 w-28 overflow-hidden rounded-full bg-background">
                <Image
                  source={artisan.avatar}
                  contentFit="cover"
                  contentPosition="top"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
            <View className="mt-3 flex-row items-center gap-1.5">
              <Text className="text-[20px] font-bold text-gray-900">
                {artisan.name}
              </Text>
              <MaterialCommunityIcons
                name="check-decagram"
                size={18}
                color="#3B82F6"
              />
            </View>

            {/* Rating + experience */}
            <View className="mt-1.5 flex-row items-center gap-2">
              <Ionicons name="star" size={15} color="#FBBF24" />
              <Text className="text-[13px] font-semibold text-gray-700">
                {artisan.rating.toFixed(1)}
              </Text>
              <Text className="text-[13px] text-gray-400">
                ({artisan.reviews} reviews)
              </Text>
              <Text className="text-[13px] text-gray-300">•</Text>
              <Text className="text-[13px] text-gray-500">
                {artisan.experienceYears}+ years experience
              </Text>
            </View>

            {/* Info chips */}
            <View className="mt-4 flex-row flex-wrap items-center justify-center gap-2">
              <InfoChip icon="location-outline" label={artisan.location} />
              <InfoChip
                icon="time-outline"
                label={`Response ${artisan.responseTime}`}
              />
              <InfoChip
                icon="briefcase-outline"
                label={`${artisan.jobsCount} Jobs`}
              />
            </View>
          </View>

          {/* About */}
          <View className="mt-7 px-5">
            <SectionTitle title="About" />
            <Text className="text-[14px] leading-5 text-gray-500">
              {artisan.about}
            </Text>
          </View>

          {/* Services */}
          <View className="mt-7 px-5">
            <SectionTitle title="Services" />
            <View className="flex-row flex-wrap gap-2">
              {artisan.services.map((service) => (
                <View
                  key={service}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2"
                >
                  <Text className="text-[13px] font-medium text-gray-700">
                    {service}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Work gallery */}
          <View className="mt-7">
            <View className="mb-3 flex-row items-center justify-between px-5">
              <Text className="text-[16px] font-bold text-gray-900">
                Work Gallery
              </Text>
              <Pressable hitSlop={8}>
                <Text className="text-[13px] font-semibold text-primary">
                  See all
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15, gap: 12 }}
            >
              {artisan.gallery.map((image, index) => (
                <View
                  key={index}
                  className="h-48 w-36 overflow-hidden rounded-2xl bg-background"
                >
                  <Image
                    source={image}
                    contentFit="cover"
                    style={{ flex: 1 }}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Header buttons overlaid on the cover */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="absolute inset-x-0 top-0 flex-row items-center justify-between px-5 pb-2"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Sticky bottom action bar */}
      <View
        style={{
          paddingBottom: Math.max(insets.bottom, 14),
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 16,
        }}
        className="flex-row items-center gap-3 border-t border-gray-100 bg-white px-5 pt-3"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chat"
          onPress={() => setAuthPromptVisible(true)}
          className="h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white"
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color={colors.primary}
          />
        </Pressable>
        <View className="flex-1">
          <Button
            label="Request Service"
            onPress={() => setAuthPromptVisible(true)}
          />
        </View>
      </View>

      {/* Gate for booking / chat */}
      <AuthPromptSheet
        visible={authPromptVisible}
        onClose={() => setAuthPromptVisible(false)}
        title="Sign up to continue"
        message="Create an account to request services and chat with artisans directly."
        icon="lock-closed"
        onSignUp={() => {
          setAuthPromptVisible(false);
          router.push('/register');
        }}
        onLogin={() => {
          setAuthPromptVisible(false);
          router.push('/login');
        }}
      />
    </View>
  );
}
