import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { config } from '@/lib/config';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { useIsFavorite, useToggleFavorite } from '@/lib/favorites/hooks';
import {
  artisanCoverSource,
  artisanPhotoSource,
  formatNaira,
  galleryImages,
} from '@/lib/catalogue/assets';
import { useArtisan } from '@/lib/catalogue/hooks';
import { useOpenChat } from '@/lib/chat/hooks';
import { timeAgo, useArtisanReviews } from '@/lib/reviews/hooks';

/** A small inline icon + label stat used in the identity row. */
function InfoStat({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text className="text-[12px] font-medium text-gray-600">{label}</Text>
    </View>
  );
}

/** Filled/empty star row for a given rating. */
function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View className="flex-row items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color="#FBBF24"
        />
      ))}
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

  const { isAuthenticated, guard, promptVisible, hidePrompt } = useAuthGate();
  const { openWithArtisan } = useOpenChat();
  const [aboutExpanded, setAboutExpanded] = useState(false);

  const { data: artisan, isLoading, isError } = useArtisan(id);
  const isFavorite = useIsFavorite(id, isAuthenticated);
  const toggleFavorite = useToggleFavorite();
  const { data: reviews } = useArtisanReviews(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !artisan) {
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

  // Two separate uploads: the cover (them at work) tops the profile; the
  // profile photo is the round avatar. Each falls back through the other /
  // bundled seed art / the initials placeholders below.
  const cover = artisanCoverSource(
    artisan.coverPhotoUrl,
    artisan.photoUrl,
    artisan.imageKey,
  );
  const avatar = artisanPhotoSource(artisan.photoUrl, artisan.imageKey);
  // Uploaded work-evidence photos win; seed artisans fall back to bundled art.
  const gallery =
    artisan.galleryUrls.length > 0
      ? artisan.galleryUrls.map((u) => ({ uri: `${config.apiBaseUrl}${u}` }))
      : galleryImages(artisan.galleryKeys);
  const initials = artisan.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Cover photo — spans up through the status bar */}
        <View className="h-72 w-full bg-background">
          {cover ? (
            <Image
              source={cover}
              contentFit="cover"
              contentPosition="top"
              style={{ flex: 1 }}
            />
          ) : (
            // No photo yet — a branded navy cover so the header buttons and
            // the curve below still read correctly.
            <View className="flex-1 items-center justify-center bg-[#0F172A]">
              <Text className="text-[72px] font-extrabold text-white/10">
                {initials}
              </Text>
            </View>
          )}
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
                {avatar ? (
                  <Image
                    source={avatar}
                    contentFit="cover"
                    contentPosition="top"
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View
                    className="flex-1 items-center justify-center"
                    style={{ backgroundColor: `${artisan.accent}22` }}
                  >
                    <Text
                      className="text-[36px] font-extrabold"
                      style={{ color: artisan.accent }}
                    >
                      {initials}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View className="mt-3 flex-row items-center gap-1.5">
              <Text className="text-[20px] font-bold text-gray-900">
                {artisan.fullName}
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
                ({artisan.reviewCount} reviews)
              </Text>
              <Text className="text-[13px] text-gray-300">•</Text>
              <Text className="text-[13px] text-gray-500">
                {artisan.experienceYears}+ years experience
              </Text>
            </View>

            {/* Info row */}
            <View className="mt-4 flex-row items-center justify-center gap-5">
              <InfoStat
                icon="location-outline"
                label={`${artisan.distanceKm} km away`}
              />
              <View className="h-3.5 w-px bg-gray-200" />
              <InfoStat
                icon="briefcase-outline"
                label={`${artisan.experienceYears}+ years exp.`}
              />
              <View className="h-3.5 w-px bg-gray-200" />
              <InfoStat
                icon={artisan.hasCertificate ? 'ribbon-outline' : 'shield-checkmark-outline'}
                label={artisan.hasCertificate ? 'Certified' : 'Verified'}
              />
            </View>
          </View>

          {/* Services */}
          <View className="mt-7 px-5">
            <SectionTitle title="Services" />
            <View className="flex-row flex-wrap gap-2">
              {artisan.services.slice(0, 3).map((service) => (
                <View
                  key={service}
                  className="flex-row items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2"
                >
                  <Ionicons
                    name="construct-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text className="text-[13px] font-medium text-gray-700">
                    {service}
                  </Text>
                </View>
              ))}
              {artisan.services.length > 3 && (
                <View className="flex-row items-center rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2">
                  <Text className="text-[13px] font-semibold text-primary">
                    +{artisan.services.length - 3} more
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* About */}
          <View className="mt-7 px-5">
            <SectionTitle title={`About ${artisan.fullName.split(' ')[0]}`} />
            <Text
              numberOfLines={aboutExpanded ? undefined : 3}
              className="text-[14px] leading-5 text-gray-500"
            >
              {artisan.about}
            </Text>
            <Pressable hitSlop={6} onPress={() => setAboutExpanded((v) => !v)}>
              <Text className="mt-1.5 text-[13px] font-semibold text-primary">
                {aboutExpanded ? 'Read less' : 'Read more'}
              </Text>
            </Pressable>
          </View>

          {/* Inspection fee */}
          <View className="mt-7 px-5">
            <View className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Ionicons
                      name="receipt-outline"
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                  <View>
                    <Text className="text-[12px] font-medium text-gray-500">
                      Inspection Fee
                    </Text>
                    <Text className="text-[20px] font-bold text-gray-900">
                      {formatNaira(artisan.inspectionFeeNaira)}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#22C55E"
                  />
                  <Text className="text-[11px] font-medium text-gray-500">
                    Satisfaction{'\n'}Guaranteed
                  </Text>
                </View>
              </View>
              <Text className="mt-3 text-[12px] leading-4 text-gray-500">
                Deducted from the final service cost once you proceed with the
                job.
              </Text>
            </View>
          </View>

          {/* Customer reviews */}
          <View className="mt-7">
            <View className="mb-3 flex-row items-center justify-between px-5">
              <Text className="text-[16px] font-bold text-gray-900">
                Customer Reviews
              </Text>
              {(reviews?.length ?? 0) > 0 ? (
                <Text className="text-[13px] font-semibold text-gray-400">
                  {reviews!.length} total
                </Text>
              ) : null}
            </View>
            {reviews === undefined ? (
              <View className="items-center py-6">
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : reviews.length === 0 ? (
              <View className="mx-5 items-center rounded-2xl border border-gray-100 bg-white px-4 py-7">
                <Ionicons name="star-outline" size={26} color={colors.textMuted} />
                <Text className="mt-2 text-[13px] font-semibold text-gray-700">
                  No reviews yet
                </Text>
                <Text className="mt-0.5 text-center text-[12px] text-gray-400">
                  Be the first to review {artisan.fullName.split(' ')[0]} after a job.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {reviews.map((review) => (
                  <View
                    key={review.id}
                    className="w-72 rounded-2xl border border-gray-100 bg-white p-4"
                    style={{
                      shadowColor: '#0F172A',
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 1,
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${artisan.accent}22` }}
                      >
                        <Text
                          className="text-[15px] font-bold"
                          style={{ color: artisan.accent }}
                        >
                          {review.customerName.trim().charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[14px] font-semibold text-gray-900">
                          {review.customerName}
                        </Text>
                        <View className="mt-0.5 flex-row items-center gap-2">
                          <Stars rating={review.rating} />
                          <Text className="text-[11px] text-gray-400">
                            {timeAgo(review.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {review.comment ? (
                      <Text
                        numberOfLines={3}
                        className="mt-3 text-[13px] leading-5 text-gray-500"
                      >
                        {review.comment}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Work gallery — hidden until there's something to show */}
          {gallery.length === 0 ? null : (
          <View className="mt-7">
            <View className="mb-3 px-5">
              <Text className="text-[16px] font-bold text-gray-900">
                Work Gallery
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15, gap: 12 }}
            >
              {gallery.map((image, index) => (
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
          )}
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
          accessibilityLabel={isFavorite ? 'Remove from saved' : 'Save artisan'}
          hitSlop={8}
          disabled={toggleFavorite.isPending}
          onPress={() =>
            guard(() => toggleFavorite.mutate({ artisanId: id, favorited: isFavorite }))
          }
          className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? '#EF4444' : colors.textPrimary}
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
          onPress={() => guard(() => openWithArtisan(id, artisan.fullName))}
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
            label="Book This Artisan"
            onPress={() =>
              guard(() =>
                router.push({
                  pathname: '/booking/request',
                  params: { service: `${artisan.specialty}`, artisanId: artisan.id },
                }),
              )
            }
          />
        </View>
      </View>

      {/* Gate for booking / chat */}
      <AuthPromptSheet
        visible={promptVisible}
        onClose={hidePrompt}
        title="Sign up to continue"
        message="Create an account to request services and chat with artisans directly."
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
    </View>
  );
}
