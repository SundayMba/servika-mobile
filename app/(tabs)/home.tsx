import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { SearchSheet } from '@/components/SearchSheet';
import { ActiveBookingCarousel } from '@/components/home/ActiveBookingCarousel';
import { ArtisanCard } from '@/components/home/ArtisanCard';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { LocationSheet } from '@/components/home/LocationSheet';
import { ServiceTile } from '@/components/home/ServiceTile';
import {
  ArtisanCarouselSkeleton,
  ServiceGridSkeleton,
} from '@/components/home/Skeletons';
import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { useBookings } from '@/lib/booking/hooks';
import type { BookingStatus } from '@/lib/booking/types';
import { artisanPhotoSource, categoryImage } from '@/lib/catalogue/assets';
import { useCategories, useNearbyArtisans } from '@/lib/catalogue/hooks';
import { useOpenChat } from '@/lib/chat/hooks';
import {
  setSelectedArea,
  useSelectedArea,
  useSelectedCoords,
} from '@/lib/location/areaStore';
import { useUnreadCount } from '@/lib/notifications/hooks';

// Bookings still "in flight" — worth surfacing a resume card on Home.
const ACTIVE_STATUSES: BookingStatus[] = [
  'Pending',
  'Accepted',
  'OnMyWay',
  'Arrived',
  'InProgress',
];

/** Greeting that tracks the local time of day. */
function timeGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Launch-promo strip with a slow diagonal shine sweeping across it. */
function PromoBanner() {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(-140);
  useEffect(() => {
    if (!width) return;
    x.value = -140;
    // Wait, then sweep across; repeat forever (the reset happens off-screen).
    x.value = withRepeat(
      withDelay(
        1600,
        withTiming(width + 140, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
  }, [width, x]);
  const shine = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { skewX: '-20deg' }],
  }));
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        backgroundColor: '#FFF4EC',
        borderWidth: 1,
        borderColor: '#FFE0CC',
        overflow: 'hidden',
      }}
      className="flex-row items-center gap-2.5 rounded-2xl px-4 py-3"
    >
      <Text className="text-[18px]">🎉</Text>
      <View className="flex-1">
        <Text className="text-[13px] font-bold text-gray-900">
          0% service fees during launch
        </Text>
        <Text className="mt-0.5 text-[11px] text-gray-500">
          Book any artisan — you only pay for the job.
        </Text>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', top: 0, bottom: 0, width: 70 }, shine]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// Approx. height of the custom bottom tab bar (excluding the safe-area inset,
// which we add separately) so scroll content clears it.
const TAB_BAR_HEIGHT = 60;

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
    icon: 'shield-checkmark',
    color: colors.primary,
    tint: '#FFEDD5',
    label: 'Verified Pros',
    sub: 'ID-checked artisans',
  },
  {
    icon: 'lock-closed',
    color: '#059669',
    tint: '#D1FAE5',
    label: 'Secure Pay',
    sub: 'Paid only when done',
  },
  {
    icon: 'star',
    color: '#F59E0B',
    tint: '#FEF3C7',
    label: 'Rated & Reviewed',
    sub: 'Real customer reviews',
  },
];

function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <View className="mb-3.5 flex-row items-center justify-between">
      <Text className="text-[17px] font-bold text-gray-900">{title}</Text>
      {onViewAll ? (
        <TouchableOpacity hitSlop={8} onPress={onViewAll}>
          <Text className="text-[13px] font-semibold text-primary">
            View all
          </Text>
        </TouchableOpacity>
      ) : null}
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
  const [locationVisible, setLocationVisible] = useState(false);
  // True while the user is dragging or the scroll is coasting — the hero's
  // typewriter/conveyor pauses so its JS ticks don't fight the scroll.
  const [scrolling, setScrolling] = useState(false);
  // Service area — shared store so the map picker can hand its result back.
  const area = useSelectedArea();
  const areaCoords = useSelectedCoords();
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { isAuthenticated, guard, promptVisible, hidePrompt } = useAuthGate();
  const { openWithArtisan } = useOpenChat();

  // Greet the signed-in user by first name; guests see "Guest".
  const firstName = user?.fullName.trim().split(/\s+/)[0] || 'Guest';
  const greeting = useMemo(() => timeGreeting(new Date().getHours()), []);

  const categoriesQuery = useCategories();
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

  // In-flight bookings → resume card (newest first from the API; the card
  // becomes a ticker when there's more than one).
  const activeBookings = useMemo(
    () =>
      (bookingsQuery.data ?? []).filter((b) =>
        ACTIVE_STATUSES.includes(b.status),
      ),
    [bookingsQuery.data],
  );

  return (
    <View className="flex-1 bg-primary">
      <StatusBar style="light" />

      {/* ── Fixed orange bar: status-bar area + greeting + search all stay
          pinned; only the hero and content below scroll ── */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="bg-primary px-5 pb-3"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[22px] font-bold text-white">
              {greeting}, {firstName}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change service location"
              activeOpacity={0.7}
              onPress={() => setLocationVisible(true)}
              className="mt-1 flex-row items-center gap-1 self-start"
            >
              <Ionicons name="location" size={13} color="#FFFFFF" />
              <Text className="text-[13px] font-medium text-white/90">
                {area}
              </Text>
              <Ionicons name="chevron-down" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
            onPress={() => router.push('/notifications')}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {unreadCount > 0 ? (
              <View
                className="absolute -right-0.5 -top-0.5 h-5 min-w-5 items-center justify-center rounded-full px-1"
                style={{ backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: colors.primary }}
              >
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {/* Search — pinned together with the greeting */}
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="search"
          onPress={() => setSearchVisible(true)}
          style={{
            shadowColor: '#7C2D12',
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
          className="mt-4 h-14 flex-row items-center gap-2.5 rounded-2xl bg-white px-4"
        >
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text className="text-[14px] text-gray-400">
            Search services, artisans...
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.primary }}
        onScrollBeginDrag={() => setScrolling(true)}
        onMomentumScrollBegin={() => setScrolling(true)}
        onScrollEndDrag={() => setScrolling(false)}
        onMomentumScrollEnd={() => setScrolling(false)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Emergency hero — thinner, bleeds to the edges; the orange below is
            the buffer the light sheet overlaps up into ── */}
        <View className="bg-primary pb-6 pt-3">
          <HeroCarousel
            bare
            height={182}
            paused={scrolling}
            onGetHelp={() => router.push('/categories')}
          />
        </View>

        {/* ── Light content sheet pulled up to overlap into the orange ── */}
        <View
          className="rounded-t-[28px] bg-background pt-7"
          style={{ marginTop: -20, paddingBottom: bottomPadding }}
        >
          {/* ── Active-booking resume card — signed-in users with an in-flight
              job; a ticker when there's more than one ── */}
          {isAuthenticated && activeBookings.length > 0 ? (
            <Animated.View
              entering={FadeInDown.duration(450)}
              className="mb-4 px-5"
            >
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
            </Animated.View>
          ) : null}

          {/* ── Launch promo — 0% commission window (PRD months 0–3) ── */}
          <Animated.View
            entering={FadeInDown.delay(80).duration(450)}
            className="mb-4 px-5"
          >
            <PromoBanner />
          </Animated.View>

          {/* ── Popular Services (wrapped in a white card) ── */}
          <Animated.View
            entering={FadeInDown.delay(140).duration(450)}
            className="mb-4 px-5"
          >
            <View className="rounded-3xl border border-gray-100/70 bg-white px-4 pb-5 pt-4">
              <SectionHeader
                title="Popular Services"
                onViewAll={() => router.push('/categories')}
              />
              {popularServices.length === 0 ? (
                categoriesQuery.isLoading ? (
                  <ServiceGridSkeleton />
                ) : (
                  <SectionState loading={false} error={categoriesQuery.isError} />
                )
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
          </Animated.View>

          {/* ── Nearby Artisans ── */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(450)}
            className="mb-4"
          >
            <View className="px-5">
              <SectionHeader
                title="Nearby Artisans"
                onViewAll={() => router.push('/artisans')}
              />
            </View>
            {(artisansQuery.data?.length ?? 0) === 0 ? (
              artisansQuery.isLoading ? (
                <ArtisanCarouselSkeleton />
              ) : (
                <View className="px-5">
                  <SectionState loading={false} error={artisansQuery.isError} />
                </View>
              )
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
                    chatLocked={!isAuthenticated}
                  />
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* ── Why Servika — trust strip (guests only; returning users get the
            resume card + live catalogue instead) ── */}
          {!isAuthenticated ? (
            <View className="mb-4 px-5">
              <View className="rounded-3xl border border-gray-100/70 bg-white px-4 pb-5 pt-4">
                <Text className="mb-4 text-[17px] font-bold text-gray-900">
                  Why book with Servika
                </Text>
                <View className="flex-row">
                  {TRUST_POINTS.map((point) => (
                    <View
                      key={point.label}
                      className="flex-1 items-center px-1"
                    >
                      <View
                        className="mb-2 h-12 w-12 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: point.tint }}
                      >
                        <Ionicons
                          name={point.icon}
                          size={22}
                          color={point.color}
                        />
                      </View>
                      <Text className="text-center text-[12px] font-semibold text-gray-900">
                        {point.label}
                      </Text>
                      <Text className="mt-0.5 text-center text-[10px] leading-3 text-gray-500">
                        {point.sub}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

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
                  <Text className="text-[13px] font-bold text-white">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* ── Become a Servika Pro — artisan recruitment (supply-side).
            Signed-in customers only; guests get the focused Sign Up banner. ── */}
          {isAuthenticated ? (
            <TouchableOpacity
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Earn as an artisan on Servika Pro"
              // The artisan surface is the separate Servika Pro app now; until
              // it's on the stores, this card explains where to earn.
              onPress={() =>
                Alert.alert(
                  'Servika Pro',
                  'Artisans work from the Servika Pro app — get verified, receive jobs near you and cash out your earnings. Coming to the app stores soon.',
                )
              }
              style={{
                backgroundColor: '#0F172A',
                shadowColor: '#0F172A',
                shadowOpacity: 0.18,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
              }}
              className="mx-5 mt-3 flex-row items-center rounded-2xl px-4 py-4"
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'rgba(249,115,22,0.16)' }}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1 px-3">
                <Text className="text-[14px] font-bold text-white">
                  Earn as an artisan
                </Text>
                <Text className="mt-0.5 text-[11px] text-white/60">
                  Get paid jobs near you on Servika Pro
                </Text>
              </View>
              <View
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      {/* ── Search (open to guests) ── */}
      <SearchSheet
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />

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
    </View>
  );
}
