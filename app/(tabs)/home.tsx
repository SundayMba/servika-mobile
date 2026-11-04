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
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { InterestSheet } from '@/components/home/InterestSheet';
import { JobTile } from '@/components/home/JobTile';
import { LocationSheet } from '@/components/home/LocationSheet';
import { ServiceSectionRow, ServiceSectionSkeleton } from '@/components/home/ServiceSections';
import { ActiveBookingSkeleton, ServiceGridSkeleton } from '@/components/home/Skeletons';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { FALLBACK_CATEGORIES } from '@/constants/fallback-categories';
import { SERVIKA_PRO_STORE_URL, SITE_URL } from '@/constants/links';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { isActiveBooking, isTrackable } from '@/lib/booking/display';
import { useBookings } from '@/lib/booking/hooks';
import { categoryImage } from '@/lib/catalogue/assets';
import { useCategories, useServiceSections } from '@/lib/catalogue/hooks';
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
 * Home, built around the job: the banner, then "what needs fixing?" as six cards. A trade opens
 * its screen, where the customer describes the job and checked artisans send prices to choose
 * from. Below, each trade's standard services: posts artisans publish at their own price and
 * Servika checks before they appear. Artisans themselves are never listed or rated in public.
 */

const TAB_BAR_HEIGHT = 60;
const GUTTER = 20;
const TILE_GAP = 10;
const DESIGN_WIDTH = 390;
const typeScale = (width: number) => Math.min(width / DESIGN_WIDTH, 1);

const TRUST_POINTS: { icon: ComponentProps<typeof Ionicons>['name']; color: string; tint: string; label: string; sub: string }[] = [
  { icon: 'pricetag-outline', color: '#C2780A', tint: '#FFF6E0', label: 'Price agreed', sub: 'before any work' },
  { icon: 'shield-checkmark-outline', color: colors.accentDeep, tint: '#FFF1E4', label: 'ID checked', sub: 'every artisan' },
  { icon: 'lock-closed-outline', color: colors.onlineInk, tint: '#E6F5EE', label: 'Paid in the app', sub: 'held until done' },
];

function SectionHead({ title, subtitle, action, onAction, scale }: { title: string; subtitle?: string; action?: string; onAction?: () => void; scale: number }) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleBlock}>
        <AppText weight="semibold" style={[styles.sectionTitle, { fontSize: Math.round(19 * scale) }]}>{title}</AppText>
        {subtitle ? <AppText style={styles.sectionSub}>{subtitle}</AppText> : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction}>
          <AppText weight="medium" style={styles.sectionAction}>{action}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 28;
  const { width } = useWindowDimensions();
  const scale = typeScale(width);
  const tileWidth = Math.floor((width - GUTTER * 2 - TILE_GAP * 2) / 3);

  const [locationVisible, setLocationVisible] = useState(false);
  const [interest, setInterest] = useState<{ category: { slug: string; name: string } | null; reason: 'service' | 'area' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  const area = useSelectedArea();
  const areaCoords = useSelectedCoords();
  const areaResolved = useAreaResolved();
  const { user } = useAuth();
  const { isAuthenticated, guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();
  const firstName = user?.fullName.trim().split(/\s+/)[0] || 'there';

  const categoriesQuery = useCategories();
  const sectionsQuery = useServiceSections();
  const availabilityQuery = useAvailability(areaCoords);
  const bookingsQuery = useBookings(undefined, { enabled: isAuthenticated });
  const unreadQuery = useUnreadCount({ enabled: isAuthenticated });
  const unreadCount = unreadQuery.data?.count ?? 0;

  const categories: Category[] = useMemo(
    () => categoriesQuery.data ?? (categoriesQuery.isError ? FALLBACK_CATEGORIES : []),
    [categoriesQuery.data, categoriesQuery.isError],
  );
  const tiles = useMemo(() => categories.filter((c) => c.isPopular), [categories]);
  const comingSoon = useMemo(() => categories.filter((c) => !c.isPopular), [categories]);
  const activeBookings = useMemo(() => (bookingsQuery.data ?? []).filter((b) => isActiveBooking(b.status)), [bookingsQuery.data]);

  // Only claim "near you" when we know where "you" is.
  const availability = areaCoords ? availabilityQuery.data : undefined;
  const outsideArea = !!areaCoords && availability?.covering === 0;
  const areaShort = area ? area.split(',')[0] : '';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        categoriesQuery.refetch(),
        sectionsQuery.refetch(),
        availabilityQuery.refetch(),
        isAuthenticated ? bookingsQuery.refetch() : Promise.resolve(),
        isAuthenticated ? unreadQuery.refetch() : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [categoriesQuery, sectionsQuery, availabilityQuery, bookingsQuery, unreadQuery, isAuthenticated]);

  // A trade opens its own screen: describe the job for prices, or book one of its standard services.
  const openTrade = (c: Category) => router.push({ pathname: '/category/[slug]', params: { slug: c.slug, name: c.name } });

  const tilesPending = refreshing || categoriesQuery.isLoading;
  const bookingsPending = refreshing || bookingsQuery.isLoading;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setScrolling(true)}
        onMomentumScrollBegin={() => setScrolling(true)}
        onScrollEndDrag={() => setScrolling(false)}
        onMomentumScrollEnd={() => setScrolling(false)}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: bottomPadding, gap: 28 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentDeep} colors={[colors.accentDeep]} progressBackgroundColor={colors.white} />
        }
      >
        {/* ── Greeting, area, bell ── */}
        <View style={styles.greetingRow}>
          <View style={styles.greeting}>
            <AppText style={styles.kicker}>{isAuthenticated ? 'Welcome back' : 'Welcome to Servika'}</AppText>
            <AppText weight="semibold" numberOfLines={1} maxFontSizeMultiplier={1} style={[styles.hello, { fontSize: Math.round(28 * scale) }]}>
              {isAuthenticated ? `Hi, ${firstName}` : 'Hi there'}
            </AppText>
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

        {/* ── Area + live availability, one line ── */}
        <View style={styles.areaRow}>
          <Pressable accessibilityRole="button" accessibilityLabel={area ? 'Change service area' : 'Set your area'} onPress={() => setLocationVisible(true)} style={styles.areaPill}>
            <Ionicons name="location" size={14} color={colors.accentDeep} />
            <AppText weight="medium" numberOfLines={1} style={styles.areaText}>
              {areaShort || (areaResolved ? 'Set your area' : 'Finding your area…')}
            </AppText>
            <Ionicons name="chevron-down" size={13} color={colors.inkSubtle} />
          </Pressable>
          {availability && !outsideArea ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <AppText weight="medium" numberOfLines={1} style={styles.liveText}>
                {availability.availableNow >= AVAILABILITY_THRESHOLD ? `${availability.availableNow} artisans online` : 'Artisans cover your area'}
              </AppText>
            </View>
          ) : !areaCoords && areaResolved ? (
            <AppText style={styles.areaHint} numberOfLines={1}>to see who is near you</AppText>
          ) : null}
        </View>

        {/* ── The original banner ── */}
        <View style={[styles.gutter, styles.hero]}>
          <HeroCarousel bare height={186} paused={scrolling} onGetHelp={() => router.push('/categories')} />
        </View>

        {/* ── A job in flight comes first ── */}
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
            <View style={styles.areaCardIcon}>
              <Ionicons name="navigate-outline" size={20} color={colors.accentDeep} />
            </View>
            <AppText weight="semibold" style={styles.areaTitle}>We&apos;re not in {areaShort || 'your area'} yet</AppText>
            <AppText style={styles.areaBody}>Servika starts in Lekki Phase 1, Ikate, Chevron and Agungi. Join the waitlist and we will tell you the day we reach you.</AppText>
            <View style={styles.areaActions}>
              <Pressable accessibilityRole="button" onPress={() => Linking.openURL(SITE_URL).catch(() => undefined)} style={styles.areaPrimary}>
                <AppText weight="semibold" style={styles.areaPrimaryLabel}>Join the waitlist</AppText>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setInterest({ category: null, reason: 'area' })} style={styles.areaSecondary}>
                <AppText weight="semibold" style={styles.areaSecondaryLabel}>Tell us where</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* ── What needs fixing? Six cards: five trades and "more" ── */}
        <View style={{ gap: 14 }}>
          <SectionHead title="What needs fixing?" action="All services" onAction={() => router.push('/categories')} scale={scale} />
          {tilesPending ? (
            <ServiceGridSkeleton />
          ) : (
            <View style={styles.grid}>
              {tiles.map((c) => (
                <JobTile key={c.id} label={c.name} image={categoryImage(c.slug)} tint={c.tint} width={tileWidth} onPress={() => openTrade(c)} />
              ))}
              <JobTile label="Something else" icon="grid-outline" width={tileWidth} onPress={() => router.push('/categories')} />
            </View>
          )}
          <AppText style={[styles.gutter, styles.note]}>Pick the job and describe it. Checked artisans send their prices, and you choose who comes.</AppText>
        </View>

        {/* ── Standard services, one row per trade: posts artisans price themselves, checked by Servika ── */}
        {sectionsQuery.isLoading ? (
          <ServiceSectionSkeleton gutter={GUTTER} />
        ) : (
          (sectionsQuery.data ?? []).map((section) => (
            <ServiceSectionRow
              key={section.categorySlug}
              section={section}
              gutter={GUTTER}
              onOpen={(item) => router.push({ pathname: '/service/[id]', params: { id: item.serviceId } })}
              onSeeAll={() => router.push({ pathname: '/category/[slug]', params: { slug: section.categorySlug, name: section.categoryName } })}
            />
          ))
        )}

        {/* ── Book again ── */}
        {isAuthenticated ? (
          <PastArtisansRail
            inset={GUTTER}
            onBook={(a) => guard(() => router.push({ pathname: '/booking/request', params: { service: a.specialty, artisanId: a.artisanId, rebook: '1' } }))}
          />
        ) : null}

        {/* ── Book someone you know ── */}
        <Pressable accessibilityRole="button" onPress={() => router.push('/book-by-code')} style={[styles.gutter, styles.codeCard]}>
          <View style={styles.codeIcon}>
            <Ionicons name="key-outline" size={19} color={colors.white} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText weight="semibold" style={styles.codeTitle}>Have an artisan&apos;s code?</AppText>
            <AppText style={styles.codeSub}>Book someone you already know, through Servika</AppText>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.ink} />
        </Pressable>

        {/* ── What Servika does, nothing more ── */}
        <View style={[styles.gutter, styles.trustCard]}>
          {TRUST_POINTS.map((point, i) => (
            <View key={point.label} style={[styles.trustItem, i > 0 && styles.trustDivider]}>
              <View style={[styles.trustIcon, { backgroundColor: point.tint }]}>
                <Ionicons name={point.icon} size={19} color={point.color} />
              </View>
              <AppText weight="semibold" style={styles.trustLabel}>{point.label}</AppText>
              <AppText style={styles.trustSub}>{point.sub}</AppText>
            </View>
          ))}
        </View>

        {/* ── Coming soon ── */}
        {comingSoon.length > 0 ? (
          <View style={{ gap: 12 }}>
            <SectionHead title="Coming soon" scale={scale} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8 }}>
              {comingSoon.map((c) => (
                <Pressable key={c.id} accessibilityRole="button" onPress={() => setInterest({ category: { slug: c.slug, name: c.name }, reason: 'service' })} style={styles.soonChip}>
                  <View style={[styles.soonDot, { backgroundColor: c.tint || colors.inkSubtle }]} />
                  <AppText weight="medium" style={styles.soonLabel}>{c.name}</AppText>
                </Pressable>
              ))}
            </ScrollView>
            <AppText style={[styles.gutter, styles.note]}>Need one of these? Tap it and tell us. Requests decide what Servika adds next.</AppText>
          </View>
        ) : null}

        {/* ── Estates and facility managers ── */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/estate')}
          style={[styles.gutter, styles.inkCard]}
        >
          <View style={styles.inkIcon}>
            <Ionicons name="business-outline" size={20} color={colors.orangeOnDark} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <AppText weight="semibold" style={styles.inkTitle}>Manage an estate or office?</AppText>
            <AppText style={styles.inkSub}>Tell us what your estate needs. Our team plans the visits and sends the right artisans.</AppText>
          </View>
          <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.75)" />
        </Pressable>

        {!isAuthenticated ? (
          <View style={[styles.gutter, styles.guestCard]}>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText weight="semibold" style={styles.guestTitle}>Ready to book?</AppText>
              <AppText style={styles.guestSub}>Make an account in a minute to book and track jobs.</AppText>
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
              <Ionicons name="briefcase-outline" size={20} color={colors.accentDeep} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <AppText weight="semibold" style={styles.guestTitle}>Are you an artisan?</AppText>
              <AppText style={styles.guestSub}>Get jobs near you on Servika Pro.</AppText>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.inkSubtle} />
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

  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: GUTTER },
  greeting: { flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: 2 },
  kicker: { fontSize: 13, color: colors.inkSubtle },
  hello: { letterSpacing: -1.1, color: colors.ink },
  bell: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  bellDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 999, backgroundColor: colors.accentDeep, borderWidth: 1.5, borderColor: colors.white },

  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: GUTTER, marginTop: -12 },
  areaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '58%', height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  areaText: { flexShrink: 1, fontSize: 13, color: colors.ink },
  livePill: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#E6F5EE' },
  liveDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.onlineInk },
  liveText: { flexShrink: 1, fontSize: 12.5, color: colors.onlineInk },
  areaHint: { flexShrink: 1, fontSize: 12.5, color: colors.inkSubtle },

  hero: { height: 186, borderRadius: 26, overflow: 'hidden', backgroundColor: colors.accentDeep },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER },
  // Takes the row's width so Android does not clip the last glyph of a shrink-wrapped Text.
  sectionTitleBlock: { flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: 2 },
  sectionTitle: { alignSelf: 'stretch', letterSpacing: -0.4, color: colors.ink },
  sectionSub: { alignSelf: 'stretch', fontSize: 12.5, color: colors.inkSubtle },
  sectionAction: { fontSize: 13, color: colors.accentDeep },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: TILE_GAP, rowGap: 20, paddingHorizontal: GUTTER },
  note: { fontSize: 12.5, lineHeight: 18, color: colors.inkSubtle },

  areaCard: { borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, padding: 18, gap: 8 },
  areaCardIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1E4', marginBottom: 2 },
  areaTitle: { fontSize: 17, color: colors.ink },
  areaBody: { fontSize: 13.5, lineHeight: 19, color: colors.inkMuted },
  areaActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  areaPrimary: { flex: 1, height: 44, borderRadius: 13, alignItems: 'stretch', justifyContent: 'center', backgroundColor: colors.accentDeep },
  areaPrimaryLabel: { fontSize: 13.5, textAlign: 'center', color: colors.white },
  areaSecondary: { flex: 1, height: 44, borderRadius: 13, alignItems: 'stretch', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairlineStrong },
  areaSecondaryLabel: { fontSize: 13.5, textAlign: 'center', color: colors.ink },

  codeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  codeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDeep },
  codeTitle: { fontSize: 14.5, color: colors.ink },
  codeSub: { fontSize: 12.5, color: colors.inkMuted },

  trustCard: { flexDirection: 'row', borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, paddingVertical: 18, paddingHorizontal: 8 },
  trustItem: { flexGrow: 1, flexShrink: 1, flexBasis: 0, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  trustDivider: { borderLeftWidth: 1, borderLeftColor: colors.hairline },
  trustIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 7, borderRadius: 13 },
  trustLabel: { alignSelf: 'stretch', fontSize: 12.5, textAlign: 'center', color: colors.ink },
  trustSub: { alignSelf: 'stretch', fontSize: 11, textAlign: 'center', color: colors.inkSubtle },

  soonChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, height: 38, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  soonDot: { width: 7, height: 7, borderRadius: 999 },
  soonLabel: { fontSize: 13, color: colors.ink },

  inkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, backgroundColor: '#14171B', padding: 16 },
  inkIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: 'rgba(249,115,22,0.16)' },
  inkTitle: { fontSize: 14.5, color: colors.white },
  inkSub: { fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.62)' },

  guestCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, padding: 16 },
  guestTitle: { fontSize: 14.5, color: colors.ink },
  guestSub: { fontSize: 12, lineHeight: 16, color: colors.inkSubtle },
  signUp: { height: 42, paddingHorizontal: 20, alignItems: 'stretch', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.accentDeep },
  signUpLabel: { fontSize: 13.5, textAlign: 'center', color: colors.white },
  proCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, padding: 16 },
  proIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#FFF1E4' },
});
