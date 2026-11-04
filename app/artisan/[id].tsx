import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { PhotoViewer, type ViewerPhoto } from '@/components/PhotoViewer';
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
import { distanceLabel } from '@/lib/catalogue/display';
import { useArtisan, invalidateCatalogueLists } from '@/lib/catalogue/hooks';
import { useOpenChat } from '@/lib/chat/hooks';

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
      <AppText weight="medium" className="text-[12px] text-gray-600">{label}</AppText>
    </View>
  );
}


function SectionTitle({ title }: { title: string }) {
  return (
    <AppText weight="semibold" className="mb-3 text-[16px] text-gray-900">{title}</AppText>
  );
}

export default function ArtisanProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isAuthenticated, guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();
  const { openWithArtisan } = useOpenChat();
  const [aboutExpanded, setAboutExpanded] = useState(false);
  // First render is unclamped so we can count real lines; then we clamp to 3
  // and only offer "Read more" when there genuinely is more to read.
  const [aboutLines, setAboutLines] = useState<number | null>(null);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  // Which uploaded work photo is open in the fullscreen viewer (null = closed).
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const { data: artisan, isLoading, isError } = useArtisan(id);
  const queryClient = useQueryClient();
  // Gone on the server: make sure the lists that led here stop showing them.
  useEffect(() => {
    if (isError) void invalidateCatalogueLists(queryClient);
  }, [isError, queryClient]);
  const isFavorite = useIsFavorite(id, isAuthenticated);
  const toggleFavorite = useToggleFavorite();

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
        <AppText weight="semibold" className="text-[16px] text-gray-900">
          Artisan not found
        </AppText>
        <Pressable hitSlop={8} className="mt-3" onPress={() => router.back()}>
          <AppText weight="semibold" className="text-[14px] text-primary">Go back</AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  // The cover is PLATFORM art only (bundled seed artwork or the branded
  // initials design) — deliberately never an artisan upload. A free-form cover
  // is a billboard: business cards / phone numbers / banners would route jobs
  // off-platform. The round profile photo below stays theirs (it's a face).
  const cover = artisanCoverSource(null, null, artisan.imageKey);
  const avatar = artisanPhotoSource(artisan.photoUrl, artisan.imageKey);
  // Uploaded work-evidence photos win; seed artisans fall back to bundled art.
  const gallery =
    artisan.galleryUrls.length > 0
      ? artisan.galleryUrls.map((u) => ({ uri: `${config.apiBaseUrl}${u}` }))
      : galleryImages(artisan.galleryKeys);
  // Uploaded photos open in the pinch-zoom viewer; bundled seed art has no URI.
  const viewerPhotos: ViewerPhoto[] = artisan.galleryUrls.map((u) => ({ uri: `${config.apiBaseUrl}${u}` }));
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
              <AppText weight="semibold" className="text-[72px] text-white/10">
                {initials}
              </AppText>
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
                    <AppText
                      weight="semibold"
                      className="text-[36px]"
                      style={{ color: artisan.accent }}
                    >
                      {initials}
                    </AppText>
                  </View>
                )}
              </View>
            </View>
            <View className="mt-3 flex-row items-center gap-1.5">
              <AppText weight="semibold" className="text-[20px] text-gray-900">
                {artisan.fullName}
              </AppText>
              {artisan.isVerified ? (
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={18}
                  color="#3B82F6"
                />
              ) : null}
            </View>

            {/* Experience and Servika history: no star average (ratings are collected, not shown) */}
            <View className="mt-1.5 flex-row items-center gap-2">
              <AppText className="text-[13px] text-gray-500">
                {[artisan.experienceYears ? `${artisan.experienceYears}+ years experience` : null, (artisan.completedJobs ?? 0) > 0 ? `${artisan.completedJobs} job${artisan.completedJobs === 1 ? '' : 's'} on Servika` : 'New on Servika'].filter(Boolean).join(' · ')}
              </AppText>
            </View>

            {/* Info row */}
            <View className="mt-4 flex-row items-center justify-center gap-5">
              {distanceLabel(artisan.distanceKm) ? (
                <>
                  <InfoStat
                    icon="location-outline"
                    label={`${distanceLabel(artisan.distanceKm)} away`}
                  />
                  <View className="h-3.5 w-px bg-gray-200" />
                </>
              ) : null}
              <InfoStat
                icon="briefcase-outline"
                label={`${artisan.experienceYears}+ years exp.`}
              />
              {artisan.hasCertificate || artisan.isVerified ? (
                <>
                  <View className="h-3.5 w-px bg-gray-200" />
                  <InfoStat
                    icon={artisan.hasCertificate ? 'ribbon-outline' : 'shield-checkmark-outline'}
                    label={artisan.hasCertificate ? 'Certified' : 'Verified'}
                  />
                </>
              ) : null}
            </View>
          </View>

          {/* Services */}
          <View className="mt-7 px-5">
            <SectionTitle title="Services" />
            <View className="flex-row flex-wrap gap-2">
              {(servicesExpanded ? artisan.services : artisan.services.slice(0, 3)).map(
                (service) => (
                  <View
                    key={service}
                    className="flex-row items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2"
                  >
                    <Ionicons
                      name="construct-outline"
                      size={14}
                      color={colors.primary}
                    />
                    <AppText weight="medium" className="text-[13px] text-gray-700">
                      {service}
                    </AppText>
                  </View>
                ),
              )}
              {artisan.services.length > 3 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setServicesExpanded((v) => !v)}
                  className="flex-row items-center rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 active:opacity-70"
                >
                  <AppText weight="semibold" className="text-[13px] text-primary">
                    {servicesExpanded
                      ? 'Show less'
                      : `+${artisan.services.length - 3} more`}
                  </AppText>
                </Pressable>
              )}
            </View>
          </View>

          {/* About */}
          <View className="mt-7 px-5">
            <SectionTitle title={`About ${artisan.fullName.split(' ')[0]}`} />
            <AppText
              numberOfLines={aboutExpanded || aboutLines === null ? undefined : 3}
              onTextLayout={(e) => {
                if (aboutLines === null) setAboutLines(e.nativeEvent.lines.length);
              }}
              className="text-[14px] leading-5 text-gray-500"
            >
              {artisan.about}
            </AppText>
            {(aboutLines ?? 0) > 3 ? (
              <Pressable hitSlop={6} onPress={() => setAboutExpanded((v) => !v)}>
                <AppText weight="semibold" className="mt-1.5 text-[13px] text-primary">
                  {aboutExpanded ? 'Read less' : 'Read more'}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          {/* How pricing works — booking and inspection are free */}
          <View className="mt-7 px-5">
            <View className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
              <View className="flex-row items-center gap-3">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-green-100">
                  <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <AppText weight="semibold" className="text-[15px] text-gray-900">
                    Free inspection · No booking fee
                  </AppText>
                  <AppText weight="medium" className="text-[12px] text-gray-500">
                    You only pay a price you&apos;ve agreed
                  </AppText>
                </View>
              </View>
              <AppText className="mt-3 text-[12px] leading-4 text-gray-500">
                {artisan.fullName.split(' ')[0]} reviews your request and sends a
                quote, or inspects the job free of charge first. Your payment is
                held securely by Servika until the work is done.
              </AppText>
            </View>
          </View>

          {/* Their standard services, each checked by Servika before it shows */}
          {artisan.pricedServices.length > 0 ? (
            <View className="mt-7 px-5">
              <SectionTitle title="Services" />
              <View className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                {artisan.pricedServices.map((s, i) => (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })}
                    className={`flex-row items-center gap-3 p-3 ${i > 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
                      {s.photoUrl ? (
                        <Image source={{ uri: `${config.apiBaseUrl}${s.photoUrl}` }} contentFit="cover" style={{ width: 48, height: 48 }} />
                      ) : (
                        <Ionicons name="construct-outline" size={20} color={colors.primary} />
                      )}
                    </View>
                    <AppText weight="semibold" numberOfLines={2} className="flex-1 text-[14px] text-gray-900">{s.name}</AppText>
                    <AppText weight="semibold" className="text-[14px] text-gray-900">{formatNaira(s.priceNaira)}</AppText>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Recent work — hidden until there's something to show */}
          {gallery.length === 0 ? null : (
          <View className="mt-7">
            <View className="mb-3 px-5">
              <AppText weight="semibold" className="text-[16px] text-gray-900">
                Recent work
              </AppText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15, gap: 12 }}
            >
              {gallery.map((image, index) => (
                <Pressable
                  key={index}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Work photo ${index + 1} of ${gallery.length}`}
                  disabled={viewerPhotos.length === 0}
                  onPress={() => setViewerIndex(index)}
                  className="h-48 w-36 overflow-hidden rounded-2xl bg-background"
                >
                  <Image
                    source={image}
                    contentFit="cover"
                    style={{ flex: 1 }}
                  />
                </Pressable>
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
            label={`Book ${artisan.fullName.split(' ')[0]}`}
            onPress={() =>
              guard(() =>
                router.push({
                  pathname: '/booking/request',
                  params: { service: `${artisan.specialty}`, artisanId: artisan.id, rebook: '1' },
                }),
              )
            }
          />
        </View>
      </View>

      {/* Gate for booking / chat */}
      {viewerPhotos.length > 0 ? (
        <PhotoViewer
          photos={viewerPhotos}
          initialIndex={viewerIndex ?? 0}
          visible={viewerIndex !== null}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
      <AuthPromptSheet
        onSignedIn={onSignedIn}
        visible={promptVisible}
        reason="book"
        onClose={hidePrompt}
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
