import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appAlert } from '@/components/ui/AppAlert';
import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { SearchSheet } from '@/components/SearchSheet';
import { ActiveBookingCarousel } from '@/components/home/ActiveBookingCarousel';
import { ArtisanCard } from '@/components/home/ArtisanCard';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { LocationSheet } from '@/components/home/LocationSheet';
import {
  FixedPriceRail,
  padWithExamples,
  toFixedPriceCard,
} from '@/components/home/FixedPriceRail';
import { ServiceTile } from '@/components/home/ServiceTile';
import {
  ActiveBookingSkeleton,
  ArtisanCarouselSkeleton,
  ServiceGridSkeleton,
} from '@/components/home/Skeletons';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { useBookings } from '@/lib/booking/hooks';
import type { BookingStatus } from '@/lib/booking/types';
import { artisanPhotoSource, categoryImage } from '@/lib/catalogue/assets';
import { useCategories, useNearbyArtisans,
  useFeaturedServices,
} from '@/lib/catalogue/hooks';
import { useOpenChat } from '@/lib/chat/hooks';
import {
  setSelectedArea,
  useSelectedArea,
  useSelectedCoords,
} from '@/lib/location/areaStore';
import { useUnreadCount } from '@/lib/notifications/hooks';

/**
 * Home, per the "Servika Home v2" design canvas.
 *
 * The orange header block is gone: the greeting and search sit on the sand
 * ground, orange is reserved for actions and the emergency card, and nothing is
 * pinned — the whole page scrolls as one, so the catalogue starts roughly 90pt
 * earlier than it used to.
 */

// Bookings still "in flight" — worth surfacing a resume card on Home.
const ACTIVE_STATUSES: BookingStatus[] = [
  'Pending',
  'Accepted',
  'OnMyWay',
  'Arrived',
  'InProgress',
];

// Approx. height of the custom bottom tab bar (excluding the safe-area inset,
// which we add separately) so scroll content clears it.
const TAB_BAR_HEIGHT = 60;

const GUTTER = 22;

/**
 * The canvas is drawn at 390pt. Phones are commonly narrower — this one is 360 —
 * so display type is scaled to the viewport rather than being fixed, which keeps
 * the proportions of the comp and stops long headings running into the edge.
 */
const DESIGN_WIDTH = 390;
const typeScale = (width: number) => Math.min(width / DESIGN_WIDTH, 1);

// "Why Servika" trust strip — speaks to the three core problems (trust, secure
// payment, social proof). Static copy; no backend needed.
const TRUST_POINTS: {
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
  tint: string;
  label: string;
  sub: string;
}[] = [
  {
    icon: 'shield-checkmark-outline',
    color: colors.accentDeep,
    tint: '#FFF1E4',
    label: 'Verified Pros',
    sub: 'ID-checked artisans',
  },
  {
    icon: 'lock-closed-outline',
    color: colors.onlineInk,
    tint: '#E6F5EE',
    label: 'Secure Pay',
    sub: 'Paid only when done',
  },
  {
    icon: 'star',
    color: '#D9950B',
    tint: '#FFF6E0',
    label: 'Rated & Reviewed',
    sub: 'Real customer reviews',
  },
];

function SectionHeader({
  title,
  subtitle,
  onViewAll,
  scale,
}: {
  title: string;
  /** One quiet line under the title, e.g. the rail's promise. */
  subtitle?: string;
  onViewAll?: () => void;
  scale: number;
}) {
  return (
    <View>
      <View style={[styles.sectionHeader, { paddingHorizontal: GUTTER }]}>
        <AppText
          weight="semibold"
          style={[styles.sectionTitle, { fontSize: Math.round(18 * scale) }]}
        >
          {title}
        </AppText>
        {onViewAll ? (
          <Pressable hitSlop={8} onPress={onViewAll} accessibilityRole="button">
            <AppText weight="medium" style={styles.viewAll}>
              View all
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {subtitle ? (
        <AppText style={[styles.sectionSubtitle, { paddingHorizontal: GUTTER }]}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

/** Shown when a section has no data and isn't loading. */
function SectionEmpty({ error }: { error?: boolean }) {
  return (
    <View style={styles.sectionEmpty}>
      <AppText style={styles.sectionEmptyLabel}>
        {error ? "Couldn't load. Pull to retry." : 'Nothing here yet.'}
      </AppText>
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 25;

  const [searchVisible, setSearchVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  // True while the user is dragging or the scroll is coasting — the hero's
  // typewriter/conveyor pauses so its JS ticks don't fight the scroll.
  const [scrolling, setScrolling] = useState(false);
  // Service area — shared store so the map picker can hand its result back.
  const area = useSelectedArea();
  const areaCoords = useSelectedCoords();
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const scale = typeScale(width);
  const { user } = useAuth();
  const { isAuthenticated, guard, promptVisible, hidePrompt } = useAuthGate();
  const { openWithArtisan } = useOpenChat();

  // Greet the signed-in user by first name; guests see "Guest".
  const firstName = user?.fullName.trim().split(/\s+/)[0] || 'Guest';

  const categoriesQuery = useCategories();
  const featuredQuery = useFeaturedServices(areaCoords ?? undefined);
  const artisansQuery = useNearbyArtisans(areaCoords);
  // Only signed-in customers have bookings; skip the (auth-only) call for guests.
  const bookingsQuery = useBookings(undefined, { enabled: isAuthenticated });
  // Unread notification count → Home bell badge (auth-only).
  const unreadQuery = useUnreadCount({ enabled: isAuthenticated });
  const unreadCount = unreadQuery.data?.count ?? 0;

  // Home shows only the "popular" subset of the catalogue.
  const popularServices = useMemo(
    () => (categoriesQuery.data ?? []).filter((c) => c.isPopular),
    [categoriesQuery.data],
  );

  // Pull-to-refresh — refetch every live section at once.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        categoriesQuery.refetch(),
        artisansQuery.refetch(),
        isAuthenticated ? bookingsQuery.refetch() : Promise.resolve(),
        isAuthenticated ? unreadQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [categoriesQuery, artisansQuery, bookingsQuery, unreadQuery, isAuthenticated]);

  // In-flight bookings → resume card.
  const activeBookings = useMemo(
    () =>
      (bookingsQuery.data ?? []).filter((b) => ACTIVE_STATUSES.includes(b.status)),
    [bookingsQuery.data],
  );

  // A refresh re-runs every section, so show each one's skeleton rather than
  // leaving stale content under a spinner — the page reads as reloading, and
  // the skeletons match the real geometry so nothing shifts when data lands.
  const servicesPending = refreshing || categoriesQuery.isLoading;
  const artisansPending = refreshing || artisansQuery.isLoading;
  const bookingsPending = refreshing || bookingsQuery.isLoading;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* The status-bar band is part of the screen, not of the scroll content,
          so nothing ever scrolls up underneath the clock and battery. */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setScrolling(true)}
        onMomentumScrollBegin={() => setScrolling(true)}
        onScrollEndDrag={() => setScrolling(false)}
        onMomentumScrollEnd={() => setScrolling(false)}
        // Child 1 is the search bar: it pins to the top while the rest scrolls.
        stickyHeaderIndices={[1]}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: bottomPadding,
          gap: 26,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentDeep}
            colors={[colors.accentDeep]}
            progressBackgroundColor={colors.white}
          />
        }
      >
        {/* ── Greeting, location, bell — scroll with the page ── */}
        <View style={styles.top}>
          <View style={styles.greetingRow}>
            <View style={styles.greeting}>
              <AppText
                weight="semibold"
                numberOfLines={1}
                maxFontSizeMultiplier={1}
                style={[styles.hello, { fontSize: Math.round(27 * scale) }]}
              >
                {`Hi, ${firstName}`}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change service location"
                onPress={() => setLocationVisible(true)}
                hitSlop={6}
                style={styles.locationRow}
              >
                <Ionicons name="location" size={13} color={colors.accentDeep} />
                <AppText weight="medium" numberOfLines={1} style={styles.location}>
                  {area}
                </AppText>
                <Ionicons name="chevron-down" size={13} color={colors.inkSubtle} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : 'Notifications'
              }
              onPress={() => router.push('/notifications')}
              android_ripple={{ color: 'rgba(20,23,27,0.06)' }}
              style={styles.bell}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.ink} />
              {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
            </Pressable>
          </View>
        </View>

        {/* ── Search — sticky. Its own sand ground hides what scrolls beneath it. ── */}
        <View style={styles.searchBand}>
          <Pressable
            accessibilityRole="search"
            accessibilityLabel="Search services and artisans"
            onPress={() => setSearchVisible(true)}
            style={styles.search}
          >
            <Ionicons name="search-outline" size={19} color={colors.inkSubtle} />
            <AppText numberOfLines={1} style={styles.searchLabel}>
              Search services, artisans...
            </AppText>
          </Pressable>
        </View>

        {/* ── Emergency hero ── */}
        <View style={styles.gutter}>
          <View style={styles.hero}>
            <HeroCarousel
              bare
              height={186}
              paused={scrolling}
              onGetHelp={() => router.push('/categories')}
            />
          </View>
        </View>

        {/* ── Resume an in-flight booking (signed in) ── */}
        {isAuthenticated && (bookingsPending || activeBookings.length > 0) ? (
          <Animated.View entering={FadeInDown.duration(420)}>
            {bookingsPending && activeBookings.length === 0 ? (
              <ActiveBookingSkeleton />
            ) : (
              <View style={styles.gutter}>
                <ActiveBookingCarousel
                  bookings={activeBookings}
                  onPress={(b) =>
                    router.push({
                      pathname: '/active-booking/dashboard',
                      params: {
                        bookingId: b.id,
                        serviceName: b.serviceName,
                        artisanName: b.artisanName ?? undefined,
                      },
                    })
                  }
                />
              </View>
            )}
          </Animated.View>
        ) : null}

        {/* ── Popular Services ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Popular Services"
            onViewAll={() => router.push('/categories')}
            scale={scale}
          />
          {servicesPending ? (
            <ServiceGridSkeleton />
          ) : popularServices.length === 0 ? (
            <SectionEmpty error={categoriesQuery.isError} />
          ) : (
            <View style={styles.serviceGrid}>
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

        {/* ── Services close to you: fixed-price listings, booked in one tap.
            Live listings when there are any nearby, padded with example cards
            so the section (and its promise) is always on the page. A live card
            opens the service profile; booking is gated there. ── */}
        <View style={styles.sectionTight}>
          <SectionHeader
            title="Services close to you"
            subtitle="The price you see is the price you pay."
            onViewAll={() => router.push('/services')}
            scale={scale}
          />
          <FixedPriceRail
            items={padWithExamples((featuredQuery.data ?? []).map(toFixedPriceCard))}
            onPress={(item) => {
              const live = item.service;
              if (live) {
                router.push({ pathname: '/service/[id]', params: { id: live.serviceId } });
              } else if (item.categorySlug) {
                router.push({ pathname: '/category/[id]', params: { id: item.categorySlug } });
              } else {
                router.push('/categories');
              }
            }}
          />
        </View>

        {/* ── Nearby Artisans ── */}
        <View style={styles.sectionTight}>
          <SectionHeader
            title="Artisans near you"
            onViewAll={() => router.push('/artisans')}
            scale={scale}
          />
          {artisansPending ? (
            <ArtisanCarouselSkeleton />
          ) : (artisansQuery.data?.length ?? 0) === 0 ? (
            <SectionEmpty error={artisansQuery.isError} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
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
                    avatar: artisanPhotoSource(artisan.photoUrl, artisan.imageKey),
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
                        params: {
                          service: artisan.specialty,
                          artisanId: artisan.id,
                        },
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
        </View>

        {/* ── Why Servika, then the sign-up nudge — guests only ── */}
        {!isAuthenticated ? (
          <View style={[styles.gutter, styles.card]}>
            <AppText weight="semibold" style={styles.cardTitle}>
              Why book with Servika
            </AppText>
            <View style={styles.trustRow}>
              {TRUST_POINTS.map((point, i) => (
                <View
                  key={point.label}
                  style={[styles.trustItem, i > 0 && styles.trustDivider]}
                >
                  <View style={[styles.trustIcon, { backgroundColor: point.tint }]}>
                    <Ionicons name={point.icon} size={20} color={point.color} />
                  </View>
                  <AppText weight="semibold" style={styles.trustLabel}>
                    {point.label}
                  </AppText>
                  <AppText style={styles.trustSub}>{point.sub}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!isAuthenticated ? (
          <View style={[styles.gutter, styles.guestRow]}>
            <View style={styles.guestCopy}>
              <AppText weight="semibold" style={styles.guestTitle}>
                Browsing as Guest
              </AppText>
              <AppText style={styles.guestSub}>
                Sign up to book services and track your jobs
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign up"
              onPress={() => router.push('/register')}
              android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
              style={styles.signUp}
            >
              <AppText weight="semibold" style={styles.signUpLabel}>
                Sign up
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {/* ── Become a Servika Pro — signed-in customers ── */}
        {isAuthenticated ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Earn as an artisan on Servika Pro"
            // The artisan surface is the separate Servika Pro app now; until
            // it's on the stores, this card explains where to earn.
            onPress={() =>
              appAlert(
                'Servika Pro',
                'Artisans work from the Servika Pro app. Get verified, receive jobs near you and cash out your earnings. Coming to the app stores soon.',
              )
            }
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            style={[styles.gutter, styles.proCard]}
          >
            <View style={styles.proIcon}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primaryLight} />
            </View>
            <View style={styles.proCopy}>
              <AppText weight="semibold" style={styles.proTitle}>
                Earn as an artisan
              </AppText>
              <AppText style={styles.proSub}>
                Get paid jobs near you on Servika Pro
              </AppText>
            </View>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.75)" />
          </Pressable>
        ) : null}
      </ScrollView>

      {/* ── Search (open to guests) ── */}
      <SearchSheet visible={searchVisible} onClose={() => setSearchVisible(false)} />

      {/* ── Service-area picker ── */}
      <LocationSheet
        visible={locationVisible}
        selected={area}
        onSelect={setSelectedArea}
        onOpenMap={() => router.push('/location-picker')}
        onClose={() => setLocationVisible(false)}
      />

      {/* ── Booking & chat are gated behind sign-in ── */}
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
    backgroundColor: colors.sand,
  },
  gutter: {
    marginHorizontal: GUTTER,
  },

  top: {
    paddingHorizontal: GUTTER,
    gap: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  greeting: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    gap: 4,
  },
  hello: {
    fontSize: 25,
    letterSpacing: -1.08,
    color: colors.ink,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  location: {
    // Room to grow before it truncates — the column is far wider than the label.
    flexShrink: 1,
    flexGrow: 1,
    fontSize: 13.5,
    color: colors.inkMuted,
  },
  bell: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.accentDeep,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  searchBand: {
    paddingHorizontal: GUTTER,
    // The container gap spaces it like any section; a little extra ground
    // below so content sliding under the pinned bar disappears cleanly.
    paddingBottom: 8,
    backgroundColor: colors.sand,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  searchLabel: {
    // Shrink rather than wrap: the field is a fixed 54pt tall, so a second line
    // is simply clipped and the placeholder reads as truncated mid-sentence.
    flexShrink: 1,
    fontSize: 14.5,
    color: colors.inkSubtle,
  },

  hero: {
    height: 186,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: colors.accentDeep,
  },

  section: {
    gap: 18,
  },
  sectionTight: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    // Not 'baseline': Yoga measures a baseline-aligned Text short on Android and
    // clips its final glyph ("Popular Service|s"). The same string renders
    // complete in a plain Text, so this was never a font problem. At 18pt beside
    // a 13pt link, centre and baseline are visually indistinguishable anyway.
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    // Takes the row's remaining width instead of shrink-wrapping to its own
    // measured width. That measurement runs a shade narrower than this face
    // actually paints, and Android clips whatever overflows the box — which is
    // why padding, tracking, trailing characters and a smaller size all failed
    // to reach it. A stretched box has width to spare, so nothing is clipped.
    // The same string always rendered whole inside a column, where a Text
    // stretches by default; only the row shrink-wrapped it.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    color: colors.ink,
  },
  viewAll: {
    flexShrink: 0,
    fontSize: 13,
    color: colors.accentDeep,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.inkMuted,
  },
  sectionEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  sectionEmptyLabel: {
    fontSize: 13,
    color: colors.inkSubtle,
  },

  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 22,
    paddingHorizontal: GUTTER,
  },
  carousel: {
    paddingHorizontal: GUTTER,
    gap: 12,
  },

  card: {
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  cardTitle: {
    marginBottom: 18,
    paddingHorizontal: 4,
    fontSize: 15,
    letterSpacing: -0.375,
    color: colors.ink,
  },
  trustRow: {
    flexDirection: 'row',
  },
  trustItem: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  trustDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.hairline,
  },
  trustIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 14,
  },
  trustLabel: {
    fontSize: 12,
    letterSpacing: -0.12,
    color: colors.ink,
    textAlign: 'center',
  },
  trustSub: {
    fontSize: 10.5,
    lineHeight: 13,
    color: colors.inkSubtle,
    textAlign: 'center',
  },

  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  guestCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    gap: 3,
  },
  guestTitle: {
    fontSize: 14,
    letterSpacing: -0.28,
    color: colors.ink,
  },
  guestSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSubtle,
  },
  signUp: {
    height: 42,
    paddingHorizontal: 20,
    alignItems: 'stretch',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.accentDeep,
  },
  signUpLabel: {
    fontSize: 13.5,
    textAlign: 'center',
    letterSpacing: -0.135,
    color: colors.white,
  },

  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#14171B',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  proIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(249,115,22,0.16)',
  },
  proCopy: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    gap: 3,
  },
  proTitle: {
    fontSize: 14,
    letterSpacing: -0.28,
    color: colors.white,
  },
  proSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.62)',
  },

});
