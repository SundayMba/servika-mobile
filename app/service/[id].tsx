import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { serviceArt } from '@/components/home/FixedPriceRail';
import { PhotoViewer, type ViewerPhoto } from '@/components/PhotoViewer';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { artisanPhotoSource, formatNaira, galleryImages } from '@/lib/catalogue/assets';
import { useArtisan, useService } from '@/lib/catalogue/hooks';
import type { ArtisanServiceOffering } from '@/lib/catalogue/types';
import { useOpenChat } from '@/lib/chat/hooks';
import { config } from '@/lib/config';
import { useIsFavorite, useToggleFavorite } from '@/lib/favorites/hooks';
import { useSelectedCoords } from '@/lib/location/areaStore';
import { timeAgo, useArtisanReviews } from '@/lib/reviews/hooks';

const HERO_HEIGHT = 340;

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
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

function Chip({
  icon,
  label,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  tone: 'green' | 'amber' | 'grey';
}) {
  const palette = {
    green: { bg: '#EAF7EF', fg: '#15803D' },
    amber: { bg: '#FFF4E5', fg: '#B45309' },
    grey: { bg: colors.sandSunk, fg: colors.inkMuted },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <Ionicons name={icon} size={12} color={palette.fg} />
      <AppText weight="semibold" style={[styles.chipLabel, { color: palette.fg }]}>
        {label}
      </AppText>
    </View>
  );
}

function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <AppText weight="semibold" style={styles.sectionTitle}>
        {title}
      </AppText>
      {right}
    </View>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <AppText weight="semibold" style={styles.stepNumberLabel}>
          {n}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="semibold" style={styles.stepTitle}>
          {title}
        </AppText>
        <AppText style={styles.stepBody}>{body}</AppText>
      </View>
    </View>
  );
}

/**
 * Service profile for a fixed-price listing: the provider's showcase of ONE
 * service — hero photo, the price and what it includes, who provides it, their
 * work gallery, more of their fixed prices, and reviews — with a sticky
 * "Book for ₦X" bar. Booking goes straight into the fixed-price flow (pay once
 * the provider accepts, held in escrow); there is no quote round-trip.
 */
export default function ServiceProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const coords = useSelectedCoords();

  const { isAuthenticated, guard, promptVisible, hidePrompt } = useAuthGate();
  const { openWithArtisan } = useOpenChat();

  const serviceQuery = useService(id, coords);
  const service = serviceQuery.data;
  const artisanId = service?.artisanId;
  const artisanQuery = useArtisan(artisanId);
  const artisan = artisanQuery.data;
  const { data: reviews } = useArtisanReviews(artisanId ?? '');
  const isFavorite = useIsFavorite(artisanId ?? '', isAuthenticated && !!artisanId);
  const toggleFavorite = useToggleFavorite();

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  if (serviceQuery.isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (serviceQuery.isError || !service) {
    return (
      <SafeAreaView style={[styles.centered, { paddingHorizontal: 24 }]}>
        <AppText weight="semibold" style={{ fontSize: 16, color: colors.ink }}>
          Service not found
        </AppText>
        <AppText style={{ marginTop: 4, fontSize: 13, color: colors.inkMuted, textAlign: 'center' }}>
          It may have been removed by the provider.
        </AppText>
        <Pressable hitSlop={8} style={{ marginTop: 14 }} onPress={() => router.back()}>
          <AppText weight="semibold" style={{ fontSize: 14, color: colors.primary }}>
            Go back
          </AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  const firstName = service.artisanName.split(/\s+/)[0];
  const hero = serviceArt(service);
  const avatar = artisanPhotoSource(service.artisanPhotoUrl, artisan?.imageKey ?? '');
  const initials = service.artisanName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  // Gallery: the service's own photo first, then the provider's work photos.
  // Uploaded photos are URIs and open in the pinch-zoom viewer; bundled seed
  // art is a static tile.
  const galleryTiles: { source: ImageSourcePropType | { uri: string }; uri?: string }[] = [];
  if (service.photoUrl) {
    const uri = `${config.apiBaseUrl}${service.photoUrl}`;
    galleryTiles.push({ source: { uri }, uri });
  }
  if (artisan) {
    if (artisan.galleryUrls.length > 0) {
      for (const u of artisan.galleryUrls) {
        const uri = `${config.apiBaseUrl}${u}`;
        galleryTiles.push({ source: { uri }, uri });
      }
    } else {
      for (const src of galleryImages(artisan.galleryKeys)) galleryTiles.push({ source: src });
    }
  }
  const viewerPhotos: ViewerPhoto[] = galleryTiles
    .filter((t): t is { source: { uri: string }; uri: string } => !!t.uri)
    .map((t) => ({ uri: t.uri }));

  const otherServices: ArtisanServiceOffering[] = (artisan?.pricedServices ?? []).filter(
    (s) => s.id !== service.serviceId,
  );
  const topReviews = (reviews ?? []).slice(0, 3);
  const distanceLabel = service.distanceKm != null ? `${service.distanceKm} km away` : null;

  const book = () =>
    guard(() =>
      router.push({
        pathname: '/booking/request',
        params: {
          service: service.name,
          artisanId: service.artisanId,
          artisanServiceId: service.serviceId,
          fixedPrice: String(service.priceNaira),
        },
      }),
    );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero: the work itself, spanning the status bar */}
        <View style={styles.hero}>
          {hero ? (
            <Image source={hero} contentFit="cover" style={StyleSheet.absoluteFill} transition={200} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroFallback]}>
              <Ionicons name="pricetags" size={54} color={colors.accentDeep} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.30)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          {galleryTiles.length > 1 ? (
            <View style={styles.heroCount}>
              <Ionicons name="images-outline" size={13} color={colors.white} />
              <AppText weight="semibold" style={styles.heroCountLabel}>
                {galleryTiles.length} photos
              </AppText>
            </View>
          ) : null}
        </View>

        {/* White sheet curving up over the hero */}
        <View style={styles.sheet}>
          <View style={styles.chipRow}>
            <Chip icon="shield-checkmark" label="Fixed price" tone="green" />
            {service.hasCertificate ? <Chip icon="ribbon" label="Certified" tone="amber" /> : null}
            <Chip
              icon={service.isAvailable ? 'ellipse' : 'time-outline'}
              label={service.isAvailable ? 'Available now' : 'Busy right now'}
              tone={service.isAvailable ? 'green' : 'grey'}
            />
          </View>

          <AppText weight="semibold" style={styles.name}>
            {service.name}
          </AppText>
          <View style={styles.priceRow}>
            <AppText weight="semibold" style={styles.price}>
              {formatNaira(service.priceNaira)}
            </AppText>
            <AppText style={styles.priceNote}>all-inclusive</AppText>
          </View>
          <AppText style={styles.promise}>
            The price you see is the price you pay. You pay only after {firstName} accepts,
            and Servika holds it safely until the job is done.
          </AppText>

          {/* What the price covers, in the artisan's own words */}
          {(service.includes && service.includes.length > 0) || service.description || service.durationMinutes ? (
            <View style={styles.coversCard}>
              <AppText weight="semibold" style={styles.coversTitle}>
                What {formatNaira(service.priceNaira)} covers{service.durationMinutes ? ` · about ${service.durationMinutes >= 60 ? `${Math.round(service.durationMinutes / 60)} ${Math.round(service.durationMinutes / 60) === 1 ? 'hour' : 'hours'}` : `${service.durationMinutes} min`}` : ''}
              </AppText>
              {(service.includes ?? []).map((line) => (
                <View key={line} style={styles.coversLine}>
                  <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                  <AppText style={styles.coversText}>{line}</AppText>
                </View>
              ))}
              {service.description ? <AppText style={styles.coversNote}>{service.description}</AppText> : null}
              <AppText style={styles.coversFoot}>Anything not listed is a separate quote. If the job turns out bigger, {firstName} stops and messages you first.</AppText>
            </View>
          ) : null}

          {/* Provider */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${service.artisanName}'s profile`}
            onPress={() =>
              router.push({ pathname: '/artisan/[id]', params: { id: service.artisanId } })
            }
            style={styles.provider}
          >
            <View style={styles.avatar}>
              {avatar ? (
                <Image source={avatar} contentFit="cover" contentPosition="top" style={{ flex: 1 }} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: `${artisan?.accent ?? colors.primary}22` }]}>
                  <AppText weight="semibold" style={{ fontSize: 18, color: artisan?.accent ?? colors.primary }}>
                    {initials}
                  </AppText>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.providerNameRow}>
                <AppText weight="semibold" numberOfLines={1} style={styles.providerName}>
                  {service.artisanName}
                </AppText>
                <MaterialCommunityIcons name="check-decagram" size={15} color="#3B82F6" />
              </View>
              <AppText numberOfLines={1} style={styles.providerMeta}>
                {[artisan?.specialty ?? 'Service provider', distanceLabel].filter(Boolean).join(' · ')}
              </AppText>
              <View style={styles.providerRating}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <AppText weight="semibold" style={styles.providerRatingValue}>
                  {service.rating.toFixed(1)}
                </AppText>
                <AppText style={styles.providerRatingCount}>
                  ({service.reviewCount} {service.reviewCount === 1 ? 'review' : 'reviews'})
                </AppText>
                {artisan ? (
                  <AppText style={styles.providerRatingCount}>
                    {' · '}
                    {artisan.experienceYears}+ yrs
                  </AppText>
                ) : null}
              </View>
            </View>
            <View style={styles.providerCta}>
              <AppText weight="semibold" style={styles.providerCtaLabel}>
                Profile
              </AppText>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </Pressable>

          {/* Gallery */}
          {galleryTiles.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle
                title={`${firstName}'s work`}
                right={
                  <AppText style={styles.sectionCount}>{galleryTiles.length} photos</AppText>
                }
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.bleed}
                contentContainerStyle={styles.galleryRow}
              >
                {galleryTiles.map((tile, i) => {
                  const viewerAt = tile.uri ? viewerPhotos.findIndex((p) => p.uri === tile.uri) : -1;
                  return (
                    <Pressable
                      key={`${tile.uri ?? 'bundled'}-${i}`}
                      accessibilityRole={tile.uri ? 'imagebutton' : 'image'}
                      accessibilityLabel={`Work photo ${i + 1}`}
                      disabled={viewerAt < 0}
                      onPress={() => setViewerIndex(viewerAt)}
                      style={styles.galleryTile}
                    >
                      <Image source={tile.source} contentFit="cover" style={{ flex: 1 }} transition={150} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* About the provider */}
          {artisan?.about ? (
            <View style={styles.section}>
              <SectionTitle title={`About ${firstName}`} />
              <AppText numberOfLines={aboutExpanded ? undefined : 4} style={styles.about}>
                {artisan.about}
              </AppText>
              {artisan.about.length > 180 ? (
                <Pressable hitSlop={6} onPress={() => setAboutExpanded((v) => !v)}>
                  <AppText weight="semibold" style={styles.readMore}>
                    {aboutExpanded ? 'Read less' : 'Read more'}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* How it works */}
          <View style={styles.section}>
            <SectionTitle title="How booking works" />
            <View style={styles.steps}>
              <Step
                n={1}
                title="Book at this price"
                body="Pick a date and time. Nothing to pay yet."
              />
              <Step
                n={2}
                title={`${firstName} accepts, you pay securely`}
                body="Servika holds the money in escrow, not the provider."
              />
              <Step
                n={3}
                title="Confirm when the job is done"
                body="Only then is the payment released. Disputes are covered."
              />
            </View>
          </View>

          {/* More from this provider */}
          {otherServices.length > 0 ? (
            <View style={styles.section}>
              <SectionTitle title={`More from ${firstName}`} />
              <View style={styles.list}>
                {otherServices.map((s, i) => (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.name}, ${formatNaira(s.priceNaira)}`}
                    onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })}
                    style={[styles.listRow, i < otherServices.length - 1 && styles.listRowDivider]}
                  >
                    <View style={styles.listThumb}>
                      {s.photoUrl ? (
                        <Image
                          source={{ uri: `${config.apiBaseUrl}${s.photoUrl}` }}
                          contentFit="cover"
                          style={{ flex: 1 }}
                        />
                      ) : (
                        <View style={styles.listThumbFallback}>
                          <Ionicons name="pricetag" size={15} color={colors.accentDeep} />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText weight="semibold" numberOfLines={1} style={styles.listName}>
                        {s.name}
                      </AppText>
                      <AppText style={styles.listMeta}>Fixed price</AppText>
                    </View>
                    <AppText weight="semibold" style={styles.listPrice}>
                      {formatNaira(s.priceNaira)}
                    </AppText>
                    <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Reviews */}
          <View style={styles.section}>
            <SectionTitle
              title="Customer reviews"
              right={
                (reviews?.length ?? 0) > 3 ? (
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() =>
                      router.push({ pathname: '/artisan/[id]', params: { id: service.artisanId } })
                    }
                  >
                    <AppText weight="medium" style={styles.sectionLink}>
                      See all {reviews!.length}
                    </AppText>
                  </Pressable>
                ) : null
              }
            />
            {reviews === undefined ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
            ) : topReviews.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Ionicons name="star-outline" size={22} color={colors.inkFaint} />
                <AppText weight="semibold" style={styles.emptyReviewsTitle}>
                  No reviews yet
                </AppText>
                <AppText style={styles.emptyReviewsBody}>
                  Be the first to review {firstName} after a job.
                </AppText>
              </View>
            ) : (
              <View style={styles.list}>
                {topReviews.map((r, i) => (
                  <View
                    key={r.id}
                    style={[styles.review, i < topReviews.length - 1 && styles.listRowDivider]}
                  >
                    <View style={styles.reviewHead}>
                      <View style={[styles.reviewAvatar, { backgroundColor: `${artisan?.accent ?? colors.primary}22` }]}>
                        <AppText weight="semibold" style={{ fontSize: 13, color: artisan?.accent ?? colors.primary }}>
                          {r.customerName.trim().charAt(0).toUpperCase()}
                        </AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText weight="semibold" style={styles.reviewName}>
                          {r.customerName}
                        </AppText>
                        <View style={styles.reviewMeta}>
                          <Stars rating={r.rating} size={11} />
                          <AppText style={styles.reviewTime}>{timeAgo(r.createdAt)}</AppText>
                        </View>
                      </View>
                    </View>
                    {r.comment ? (
                      <AppText numberOfLines={4} style={styles.reviewBody}>
                        {r.comment}
                      </AppText>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Header buttons over the hero */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 6 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          style={styles.roundBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Remove provider from saved' : 'Save provider'}
          hitSlop={8}
          disabled={toggleFavorite.isPending}
          onPress={() =>
            guard(() =>
              toggleFavorite.mutate({ artisanId: service.artisanId, favorited: isFavorite }),
            )
          }
          style={styles.roundBtn}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? '#EF4444' : colors.textPrimary}
          />
        </Pressable>
      </View>

      {/* Sticky book bar */}
      <View style={[styles.bookBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chat with ${firstName}`}
          onPress={() => guard(() => openWithArtisan(service.artisanId, service.artisanName))}
          style={styles.chatBtn}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Button label={`Book for ${formatNaira(service.priceNaira)}`} onPress={book} />
        </View>
      </View>

      <PhotoViewer
        photos={viewerPhotos}
        initialIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />

      <AuthPromptSheet
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.sand,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentTint,
  },
  heroCount: {
    position: 'absolute',
    right: 18,
    bottom: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(20,23,27,0.6)',
  },
  heroCountLabel: {
    fontSize: 11.5,
    color: colors.white,
  },
  sheet: {
    marginTop: -32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipLabel: {
    fontSize: 11,
  },
  name: {
    marginTop: 12,
    fontSize: 23,
    lineHeight: 29,
    color: colors.ink,
  },
  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  price: {
    fontSize: 27,
    lineHeight: 32,
    color: colors.accentDeep,
  },
  priceNote: {
    fontSize: 13,
    color: colors.inkMuted,
    paddingBottom: 4,
  },
  promise: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  coversCard: { marginTop: 18, gap: 8, padding: 14, borderRadius: 18, backgroundColor: '#F6FBF7', borderWidth: 1, borderColor: '#DCF0E3' },
  coversTitle: { fontSize: 15, color: colors.ink },
  coversLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  coversText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink },
  coversNote: { fontSize: 13.5, lineHeight: 20, color: colors.inkMuted },
  coversFoot: { fontSize: 12.5, lineHeight: 18, color: colors.inkMuted },
  provider: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  avatar: {
    height: 54,
    width: 54,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.sand,
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerName: {
    flexShrink: 1,
    fontSize: 15,
    color: colors.ink,
  },
  providerMeta: {
    marginTop: 1,
    fontSize: 12,
    color: colors.inkMuted,
  },
  providerRating: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  providerRatingValue: {
    fontSize: 12,
    color: colors.ink,
  },
  providerRatingCount: {
    fontSize: 12,
    color: colors.inkMuted,
  },
  providerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingLeft: 4,
  },
  providerCtaLabel: {
    fontSize: 12.5,
    color: colors.primary,
  },
  section: {
    marginTop: 26,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16.5,
    color: colors.ink,
  },
  sectionCount: {
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.accentDeep,
  },
  bleed: {
    marginHorizontal: -20,
  },
  galleryRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  galleryTile: {
    width: 150,
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.sand,
  },
  about: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  readMore: {
    marginTop: 6,
    fontSize: 13,
    color: colors.primary,
  },
  steps: {
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F6FBF7',
    borderWidth: 1,
    borderColor: '#DCF0E3',
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    height: 26,
    width: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
  },
  stepNumberLabel: {
    fontSize: 12.5,
    color: colors.white,
  },
  stepTitle: {
    fontSize: 13.5,
    color: colors.ink,
  },
  stepBody: {
    marginTop: 1,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.inkMuted,
  },
  list: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  listRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  listThumb: {
    height: 46,
    width: 46,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.sand,
  },
  listThumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentTint,
  },
  listName: {
    fontSize: 14,
    color: colors.ink,
  },
  listMeta: {
    marginTop: 1,
    fontSize: 12,
    color: colors.inkMuted,
  },
  listPrice: {
    fontSize: 14,
    color: colors.ink,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  emptyReviewsTitle: {
    marginTop: 8,
    fontSize: 13.5,
    color: colors.ink,
  },
  emptyReviewsBody: {
    marginTop: 2,
    fontSize: 12.5,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  review: {
    padding: 14,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewName: {
    fontSize: 13.5,
    color: colors.ink,
  },
  reviewMeta: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewTime: {
    fontSize: 11,
    color: colors.inkFaint,
  },
  reviewBody: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  roundBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  bookBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.white,
  },
  chatBtn: {
    height: 54,
    width: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
});
