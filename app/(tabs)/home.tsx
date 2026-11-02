import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import {
  Linking,
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
import { PastArtisansRail } from '@/components/booking/PastArtisansRail';
import { ActiveBookingCarousel } from '@/components/home/ActiveBookingCarousel';
import { InterestSheet } from '@/components/home/InterestSheet';
import { LocationSheet } from '@/components/home/LocationSheet';
import { ServiceTile } from '@/components/home/ServiceTile';
import { ActiveBookingSkeleton, ServiceGridSkeleton } from '@/components/home/Skeletons';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { FALLBACK_CATEGORIES } from '@/constants/fallback-categories';
import { SERVIKA_PRO_STORE_URL, SITE_URL, SUPPORT_EMAIL } from '@/constants/links';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { isActiveBooking, isTrackable } from '@/lib/booking/display';
import { useBookings } from '@/lib/booking/hooks';
import { categoryImage } from '@/lib/catalogue/assets';
import { useCategories } from '@/lib/catalogue/hooks';
import type { Category } from '@/lib/catalogue/types';
import { AVAILABILITY_THRESHOLD, useAvailability } from '@/lib/home/hooks';
import {
  setSelectedArea,
  useAreaResolved,
  useSelectedArea,
  useSelectedCoords,
} from '@/lib/location/areaStore';
import { useUnreadCount } from '@/lib/notifications/hooks';

/**
 * Home, built around the job, not the person (Business Model v1.4, section 15). The customer
 * says what is broken; Servika handles who, when and how much. Nobody is browsed here: the
 * artisan appears once assigned, or by name only through Book again or a personal code.
 */

const TAB_BAR_HEIGHT = 60;
const GUTTER = 22;
const DESIGN_WIDTH = 390;
const typeScale = (width: number) => Math.min(width / DESIGN_WIDTH, 1);

// What Servika actually does, in plain words. Nothing here that operations cannot keep.
const TRUST_POINTS: { icon: ComponentProps<typeof Ionicons>['name']; color: string; tint: string; label: string; sub: string }[] = [
  { icon: 'pricetag-outline', color: '#D9950B', tint: '#FFF6E0', label: 'Price agreed', sub: 'Before any work starts' },
  { icon: 'shield-checkmark-outline', color: colors.accentDeep, tint: '#FFF1E4', label: 'ID checked', sub: 'Every artisan, by Servika' },
  { icon: 'lock-closed-outline', color: colors.onlineInk, tint: '#E6F5EE', label: 'Pay in the app', sub: 'Held until the job is done' },
];

function SectionTitle({ title, subtitle, scale }: { title: string; subtitle?: string | null; scale: number }) {
  return (
    <View style={{ paddingHorizontal: GUTTER, gap: 3 }}>
      <AppText weight="semibold" style={[styles.sectionTitle, { fontSize: Math.round(18 * scale) }]}>{title}</AppText>
      {subtitle ? <AppText style={styles.sectionSubtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 25;
  const { width } = useWindowDimensions();
  const scale = typeScale(width);

  const [locationVisible, setLocationVisible] = useState(false);
  const [interest, setInterest] = useState<{ category: { slug: string; name: string } | null; reason: 'service' | 'area' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const area = useSelectedArea();
  const areaCoords = useSelectedCoords();
  const areaResolved = useAreaResolved();
  const { user } = useAuth();
  const { isAuthenticated, guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();
  const firstName = user?.fullName.trim().split(/\s+/)[0] || 'Guest';

  const categoriesQuery = useCategories();
  const availabilityQuery = useAvailability(areaCoords);
  const bookingsQuery = useBookings(undefined, { enabled: isAuthenticated });
  const unreadQuery = useUnreadCount({ enabled: isAuthenticated });
  const unreadCount = unreadQuery.data?.count ?? 0;

  const categories: Category[] = useMemo(
    () => categoriesQuery.data ?? (categoriesQuery.isError ? FALLBACK_CATEGORIES : []),
    [categoriesQuery.data, categoriesQuery.isError],
  );
  // The launch categories are the tiles; everything else active is "coming soon".
  const tiles = useMemo(() => categories.filter((c) => c.isPopular), [categories]);
  const comingSoon = useMemo(() => categories.filter((c) => !c.isPopular), [categories]);
  const activeBookings = useMemo(() => (bookingsQuery.data ?? []).filter((b) => isActiveBooking(b.status)), [bookingsQuery.data]);

  const availability = availabilityQuery.data;
  const outsideArea = !!areaCoords && availability?.covering === 0;
  const availabilityLine = !availability
    ? null
    : availability.availableNow >= AVAILABILITY_THRESHOLD
      ? `${availability.availableNow} checked artisans available near you`
      : availability.covering > 0
        ? `Checked artisans cover ${area || 'your area'}. Tell us the job and Servika finds one.`
        : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        categoriesQuery.refetch(),
        availabilityQuery.refetch(),
        isAuthenticated ? bookingsQuery.refetch() : Promise.resolve(),
        isAuthenticated ? unreadQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [categoriesQuery, availabilityQuery, bookingsQuery, unreadQuery, isAuthenticated]);

  const startJob = (c: Category) =>
    guard(() =>
      router.push({ pathname: '/booking/request', params: { categorySlug: c.slug, open: '1', service: c.name } }),
    );

  const tilesPending = refreshing || categoriesQuery.isLoading;
  const bookingsPending = refreshing || bookingsQuery.isLoading;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: bottomPadding, gap: 26 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentDeep} colors={[colors.accentDeep]} progressBackgroundColor={colors.white} />
        }
      >
        {/* ── Greeting, location, bell ── */}
        <View style={styles.greetingRow}>
          <View style={styles.greeting}>
            <AppText weight="semibold" numberOfLines={1} maxFontSizeMultiplier={1} style={[styles.hello, { fontSize: Math.round(27 * scale) }]}>
              {`Hi, ${firstName}`}
            </AppText>
            <Pressable accessibilityRole="button" accessibilityLabel={area ? 'Change service location' : 'Set your area'} onPress={() => setLocationVisible(true)} hitSlop={6} style={styles.locationRow}>
              <Ionicons name="location" size={13} color={colors.accentDeep} />
              <AppText weight="medium" numberOfLines={1} style={styles.location}>
                {area || (areaResolved ? 'Set your area' : 'Finding your area…')}
              </AppText>
              <Ionicons name="chevron-down" size={13} color={colors.inkSubtle} />
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            onPress={() => router.push('/notifications')}
            style={styles.bell}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.ink} />
            {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
          </Pressable>
        </View>

        {/* ── Resume a job in flight (moves to the top while one is live) ── */}
        {isAuthenticated && (bookingsPending || activeBookings.length > 0) ? (
          <Animated.View entering={FadeInDown.duration(420)}>
            {bookingsPending && activeBookings.length === 0 ? (
              <ActiveBookingSkeleton />
            ) : (
              <View style={styles.gutter}>
                <ActiveBookingCarousel
                  bookings={activeBookings}
                  onPress={(b) => {
                    if (b.status === 'AwaitingConfirmation') {
                      router.push({ pathname: '/active-booking/completion', params: { id: b.id, name: b.artisanName ?? undefined, serviceName: b.serviceName } });
                    } else if (isTrackable(b.status)) {
                      router.push({ pathname: '/active-booking/dashboard', params: { bookingId: b.id, serviceName: b.serviceName, artisanName: b.artisanName ?? undefined } });
                    } else {
                      router.push({ pathname: '/booking/[id]', params: { id: b.id } });
                    }
                  }}
                />
              </View>
            )}
          </Animated.View>
        ) : null}

        {/* ── Not in your area yet ── */}
        {outsideArea ? (
          <View style={[styles.gutter, styles.areaCard]}>
            <AppText weight="semibold" style={styles.areaTitle}>We&apos;re not in your area yet</AppText>
            <AppText style={styles.areaBody}>
              Servika starts in Lekki Phase 1, Ikate, Chevron and Agungi. Join the waitlist and we will tell you when we reach {area || 'you'}.
            </AppText>
            <View style={styles.areaActions}>
              <Pressable accessibilityRole="button" onPress={() => Linking.openURL(SITE_URL).catch(() => undefined)} style={styles.areaPrimary}>
                <AppText weight="semibold" style={styles.areaPrimaryLabel}>Join the waitlist</AppText>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setInterest({ category: null, reason: 'area' })} style={styles.areaSecondary}>
                <AppText weight="semibold" style={styles.areaSecondaryLabel}>Tell us where you are</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* ── What needs fixing? Five tiles; a tap starts the request, Servika assigns the artisan ── */}
        <View style={{ gap: 18 }}>
          <SectionTitle title="What needs fixing?" subtitle={outsideArea ? null : availabilityLine} scale={scale} />
          {tilesPending ? (
            <ServiceGridSkeleton />
          ) : (
            <View style={styles.serviceGrid}>
              {tiles.map((c) => (
                <ServiceTile key={c.id} service={{ label: c.name, image: categoryImage(c.slug) }} onPress={() => startJob(c)} />
              ))}
            </View>
          )}
          <Pressable accessibilityRole="button" onPress={() => router.push('/categories')} style={[styles.gutter, styles.linkRow]}>
            <Ionicons name="grid-outline" size={16} color={colors.accentDeep} />
            <AppText weight="semibold" style={styles.linkLabel}>Something else? See every service</AppText>
            <Ionicons name="chevron-forward" size={16} color={colors.inkSubtle} />
          </Pressable>
        </View>

        {/* ── Book again, or book someone you know by their code ── */}
        <View style={styles.gutter}>
          {isAuthenticated ? (
            <PastArtisansRail
              onBook={(a) =>
                guard(() => router.push({ pathname: '/booking/request', params: { service: a.specialty, artisanId: a.artisanId, rebook: '1' } }))
              }
            />
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => router.push('/book-by-code')} style={styles.linkRow}>
            <Ionicons name="key-outline" size={16} color={colors.accentDeep} />
            <AppText weight="semibold" style={styles.linkLabel}>Have an artisan&apos;s code? Book them directly</AppText>
            <Ionicons name="chevron-forward" size={16} color={colors.inkSubtle} />
          </Pressable>
        </View>

        {/* ── What we check, nothing more ── */}
        <View style={[styles.gutter, styles.card]}>
          <View style={styles.trustRow}>
            {TRUST_POINTS.map((point, i) => (
              <View key={point.label} style={[styles.trustItem, i > 0 && styles.trustDivider]}>
                <View style={[styles.trustIcon, { backgroundColor: point.tint }]}>
                  <Ionicons name={point.icon} size={20} color={point.color} />
                </View>
                <AppText weight="semibold" style={styles.trustLabel}>{point.label}</AppText>
                <AppText style={styles.trustSub}>{point.sub}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* ── Coming soon: measure demand before committing supply ── */}
        {comingSoon.length > 0 ? (
          <View style={{ gap: 14 }}>
            <SectionTitle title="Coming soon" subtitle="Tap one to tell us you need it." scale={scale} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8 }}>
              {comingSoon.map((c) => (
                <Pressable key={c.id} accessibilityRole="button" onPress={() => setInterest({ category: { slug: c.slug, name: c.name }, reason: 'service' })} style={styles.soonChip}>
                  <AppText weight="medium" style={styles.soonLabel}>{c.name}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ── Estates and facility managers: the start of the B2B pipeline ── */}
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Estate or facility maintenance with Servika')}`).catch(() =>
              appAlert('Talk to us', `Write to ${SUPPORT_EMAIL}.`),
            )
          }
          style={[styles.gutter, styles.estateCard]}
        >
          <View style={styles.estateIcon}>
            <Ionicons name="business-outline" size={20} color={colors.accentDeep} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <AppText weight="semibold" style={styles.estateTitle}>Manage an estate or facility?</AppText>
            <AppText style={styles.estateSub}>Scheduled maintenance at set prices, with a record of every visit. Talk to us.</AppText>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.inkSubtle} />
        </Pressable>

        {!isAuthenticated ? (
          <View style={[styles.gutter, styles.guestRow]}>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText weight="semibold" style={styles.guestTitle}>Browsing as Guest</AppText>
              <AppText style={styles.guestSub}>Sign up to book a job and track it</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Sign up" onPress={() => router.push('/register')} style={styles.signUp}>
              <AppText weight="semibold" style={styles.signUpLabel}>Sign up</AppText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Earn as an artisan on Servika Pro"
            onPress={() => Linking.openURL(SERVIKA_PRO_STORE_URL).catch(() => appAlert('Servika Pro', 'Search "Servika Pro" on Google Play to get the app.'))}
            style={[styles.gutter, styles.proCard]}
          >
            <View style={styles.proIcon}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primaryLight} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText weight="semibold" style={styles.proTitle}>Earn as an artisan</AppText>
              <AppText style={styles.proSub}>Get jobs near you on Servika Pro</AppText>
            </View>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.75)" />
          </Pressable>
        )}
      </ScrollView>

      <LocationSheet
        visible={locationVisible}
        selected={area}
        onSelect={setSelectedArea}
        onOpenMap={() => router.push('/location-picker')}
        onClose={() => setLocationVisible(false)}
      />
      <InterestSheet visible={!!interest} onClose={() => setInterest(null)} category={interest?.category ?? null} reason={interest?.reason ?? 'service'} />
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  gutter: { marginHorizontal: GUTTER },
  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: GUTTER },
  greeting: { flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: 4 },
  hello: { fontSize: 25, letterSpacing: -1.08, color: colors.ink },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  location: { flexShrink: 1, flexGrow: 1, fontSize: 13.5, color: colors.inkMuted },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  bellDot: { position: 'absolute', top: 9, right: 11, width: 7, height: 7, borderRadius: 999, backgroundColor: colors.accentDeep, borderWidth: 1.5, borderColor: colors.white },

  // Stretched title box: Android clips a shrink-wrapped Text in a row (see the old Home notes).
  sectionTitle: { alignSelf: 'stretch', color: colors.ink },
  sectionSubtitle: { fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 22, paddingHorizontal: GUTTER },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  linkLabel: { flex: 1, fontSize: 13.5, color: colors.ink },

  areaCard: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, padding: 18, gap: 8 },
  areaTitle: { fontSize: 17, color: colors.ink },
  areaBody: { fontSize: 13.5, lineHeight: 19, color: colors.inkMuted },
  areaActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  areaPrimary: { flex: 1, height: 44, borderRadius: 13, alignItems: 'stretch', justifyContent: 'center', backgroundColor: colors.accentDeep },
  areaPrimaryLabel: { fontSize: 13.5, textAlign: 'center', color: colors.white },
  areaSecondary: { flex: 1, height: 44, borderRadius: 13, alignItems: 'stretch', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairlineStrong },
  areaSecondaryLabel: { fontSize: 13.5, textAlign: 'center', color: colors.ink },

  card: { borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 16, paddingVertical: 20 },
  trustRow: { flexDirection: 'row' },
  trustItem: { flexGrow: 1, flexShrink: 1, flexBasis: 0, alignItems: 'center', gap: 4, paddingHorizontal: 6 },
  trustDivider: { borderLeftWidth: 1, borderLeftColor: colors.hairline },
  trustIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderRadius: 14 },
  trustLabel: { alignSelf: 'stretch', fontSize: 12, letterSpacing: -0.12, color: colors.ink, textAlign: 'center' },
  trustSub: { alignSelf: 'stretch', fontSize: 10.5, lineHeight: 13, color: colors.inkSubtle, textAlign: 'center' },

  soonChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairlineStrong },
  soonLabel: { fontSize: 13, color: colors.inkMuted },

  estateCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, padding: 16 },
  estateIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFF1E4' },
  estateTitle: { fontSize: 14, color: colors.ink },
  estateSub: { fontSize: 12, lineHeight: 16, color: colors.inkSubtle },

  guestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 16, paddingVertical: 18 },
  guestTitle: { fontSize: 14, letterSpacing: -0.28, color: colors.ink },
  guestSub: { fontSize: 11.5, lineHeight: 16, color: colors.inkSubtle },
  signUp: { height: 42, paddingHorizontal: 20, alignItems: 'stretch', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.accentDeep },
  signUpLabel: { fontSize: 13.5, textAlign: 'center', color: colors.white },

  proCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, backgroundColor: '#14171B', padding: 16 },
  proIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(249,115,22,0.16)' },
  proTitle: { fontSize: 14, letterSpacing: -0.28, color: colors.white },
  proSub: { fontSize: 11.5, lineHeight: 16, color: 'rgba(255,255,255,0.62)' },
});
