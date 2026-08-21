import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { SearchSheet } from '@/components/SearchSheet';
import { AppText } from '@/components/ui/AppText';
import { SwipeBack } from '@/components/ui/SwipeBack';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { artisanPhotoSource } from '@/lib/catalogue/assets';
import { useCategories, useCategoryArtisans } from '@/lib/catalogue/hooks';
import type { ArtisanSummary } from '@/lib/catalogue/types';

/**
 * Category detail, per the "Servika Category v2" canvas — the same system as
 * Home and onboarding: Instrument Sans at 500/600, the deeper orange, warm sand
 * ground and hairline-bordered white surfaces in place of the grey card look.
 */

const GUTTER = 22;

function ArtisanRow({
  artisan,
  onPress,
}: {
  artisan: ArtisanSummary;
  onPress: () => void;
}) {
  const avatar = artisanPhotoSource(artisan.photoUrl, artisan.imageKey);
  // "New" rather than 0.0 — an unrated artisan is new, not badly rated. Keyed
  // off reviewCount, since a real 0.0 average is possible once reviews exist.
  const unrated = artisan.reviewCount === 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${artisan.fullName}, ${artisan.specialty}`}
      onPress={onPress}
      android_ripple={{ color: 'rgba(20,23,27,0.06)' }}
      style={styles.row}
    >
      <View style={styles.avatar}>
        {avatar ? (
          <Image source={avatar} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} />
        ) : null}
      </View>

      <View style={styles.rowBody}>
        <View style={styles.nameRow}>
          <AppText weight="semibold" numberOfLines={1} style={styles.name}>
            {artisan.fullName}
          </AppText>
          {artisan.isAvailable ? (
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <AppText weight="semibold" style={styles.statusLabel}>
                Available
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <AppText weight="medium" numberOfLines={1} style={styles.specialty}>
            {artisan.specialty}
          </AppText>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={12} color={colors.accentDeep} />
            <AppText weight="medium" style={styles.metaValue}>
              {unrated ? 'New' : artisan.rating.toFixed(1)}
            </AppText>
          </View>
          {/* Distance only when we actually have one. The comp shows an area
              name in its place, but we do not know where an artisan is when the
              distance is unknown, and printing the browsing area here would
              assert a location the API never gave us. */}
          {artisan.distanceKm > 0 ? (
            <View style={styles.metaItemTight}>
              <Ionicons name="location-outline" size={12} color={colors.inkSubtle} />
              <AppText style={styles.metaMuted}>{`${artisan.distanceKm} km`}</AppText>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={17} color={colors.inkSubtle} />
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
      <SafeAreaView style={styles.centred}>
        <ActivityIndicator color={colors.accentDeep} />
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView style={styles.centred}>
        <AppText weight="semibold" style={styles.notFound}>
          Category not found
        </AppText>
        <Pressable hitSlop={8} style={styles.notFoundAction} onPress={() => router.back()}>
          <AppText weight="semibold" style={styles.notFoundLink}>
            Go back
          </AppText>
        </Pressable>
      </SafeAreaView>
    );
  }

  const count = artisans?.length ?? 0;
  const service = category.name.toLowerCase();

  return (
    <SwipeBack>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            android_ripple={{ color: 'rgba(20,23,27,0.06)', borderless: true }}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <AppText weight="semibold" style={styles.title}>
            {category.name}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search artisans and services"
          onPress={() => setSearchVisible(true)}
          style={styles.search}
        >
          <Ionicons name="search-outline" size={19} color={colors.inkSubtle} />
          <AppText numberOfLines={1} style={styles.searchLabel}>
            Search artisans &amp; services...
          </AppText>
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <Animated.View entering={FadeInDown.duration(420)} style={styles.stack}>
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
              android_ripple={{ color: 'rgba(20,23,27,0.06)' }}
              style={styles.promo}
            >
              <View style={styles.promoIcon}>
                <Ionicons name="megaphone-outline" size={21} color={colors.accentDeep} />
              </View>
              <View style={styles.promoCopy}>
                <AppText weight="semibold" style={styles.promoTitle}>
                  Not sure who to pick?
                </AppText>
                <AppText style={styles.promoSub}>
                  {`Post a request and the first available ${service} pro takes it.`}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={17} color={colors.accentDeep} />
            </Pressable>

            <AppText weight="medium" style={styles.count}>
              {loadingArtisans
                ? 'Finding artisans…'
                : `${count} artisan${count === 1 ? '' : 's'} available`}
            </AppText>

            {loadingArtisans ? (
              <ActivityIndicator color={colors.accentDeep} style={styles.loading} />
            ) : count === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={30} color={colors.accentDeep} />
                </View>
                <AppText weight="semibold" style={styles.emptyTitle}>
                  No artisans yet
                </AppText>
                <AppText style={styles.emptyBody}>
                  {`We're onboarding ${service} pros in your area. Check back soon.`}
                </AppText>
              </View>
            ) : (
              artisans?.map((artisan) => (
                <ArtisanRow
                  key={artisan.id}
                  artisan={artisan}
                  onPress={() =>
                    router.push({ pathname: '/artisan/[id]', params: { id: artisan.id } })
                  }
                />
              ))
            )}
          </Animated.View>
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
    </SwipeBack>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: GUTTER,
    backgroundColor: colors.sand,
  },
  notFound: {
    fontSize: 16,
    color: colors.ink,
  },
  notFoundAction: {
    marginTop: 12,
  },
  notFoundLink: {
    fontSize: 14,
    color: colors.accentDeep,
  },

  header: {
    height: 44,
    paddingHorizontal: GUTTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    left: GUTTER,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  title: {
    fontSize: 17,
    color: colors.ink,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    marginTop: 14,
    marginHorizontal: GUTTER,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  searchLabel: {
    flexShrink: 1,
    fontSize: 14.5,
    color: colors.inkSubtle,
  },

  body: {
    padding: GUTTER,
    paddingBottom: 32,
  },
  stack: {
    gap: 16,
  },

  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  promoIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#FFF1E4',
  },
  promoCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    gap: 2,
  },
  promoTitle: {
    fontSize: 14,
    color: colors.ink,
  },
  promoSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSubtle,
  },

  count: {
    paddingHorizontal: 4,
    fontSize: 12.5,
    color: colors.inkSubtle,
  },
  loading: {
    marginTop: 24,
  },

  row: {
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
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.sand,
  },
  rowBody: {
    // Stretch rather than hug: a shrink-wrapped Text box gets its final glyph
    // clipped by Android, which is what bit every label on Home.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontSize: 15.5,
    color: colors.ink,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#E6F5EE',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.online,
  },
  statusLabel: {
    fontSize: 9.5,
    letterSpacing: 0.19,
    color: colors.onlineInk,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemTight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  specialty: {
    flexShrink: 1,
    fontSize: 12.5,
    color: colors.accentDeep,
  },
  metaValue: {
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  metaMuted: {
    fontSize: 12.5,
    color: colors.inkSubtle,
  },

  empty: {
    alignItems: 'center',
    marginTop: 44,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  emptyTitle: {
    fontSize: 19,
    color: colors.ink,
  },
  emptyBody: {
    maxWidth: 250,
    marginTop: 4,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
