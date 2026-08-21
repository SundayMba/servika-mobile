import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { formatDate, statusTone } from '@/lib/booking/display';
import { useBookings } from '@/lib/booking/hooks';
import type { BookingStatus, BookingSummary } from '@/lib/booking/types';

/**
 * Bookings, on the v2 system ("Servika Bookings" canvas).
 *
 * Sand ground, Instrument Sans at 500/600, one orange, hairline-bordered white
 * surfaces — the same language as Home, Category and onboarding, which this
 * screen was a generation behind.
 */

type TabId = 'active' | 'completed' | 'cancelled';

const ACTIVE: BookingStatus[] = [
  'Open',
  'Pending',
  'Accepted',
  'OnMyWay',
  'Arrived',
  'InProgress',
  'AwaitingConfirmation',
];
const CANCELLED: BookingStatus[] = ['Cancelled', 'Rejected', 'Expired', 'Disputed'];

function inTab(status: BookingStatus, tab: TabId): boolean {
  if (tab === 'active') return ACTIVE.includes(status);
  if (tab === 'completed') return status === 'Completed';
  return CANCELLED.includes(status);
}

function BookingCard({
  booking,
  onPress,
}: {
  booking: BookingSummary;
  onPress: () => void;
}) {
  const tone = statusTone(booking.status);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${booking.serviceName}, ${tone.label}`}
      onPress={onPress}
      android_ripple={{ color: 'rgba(20,23,27,0.06)' }}
      style={styles.card}
    >
      <View style={styles.cardIcon}>
        <Ionicons name="construct-outline" size={21} color={colors.accentDeep} />
      </View>

      <View style={styles.cardBody}>
        <AppText weight="semibold" numberOfLines={1} style={styles.service}>
          {booking.serviceName}
        </AppText>
        {booking.artisanName ? (
          <AppText weight="medium" numberOfLines={1} style={styles.artisan}>
            {booking.artisanName}
          </AppText>
        ) : null}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.inkFaint} />
          {/* Two lines: "22 Aug 2026 • Morning (8am - 12pm)" beside a 100pt
              status column does not fit one line at 360dp, and the slot is the
              half that was being cut. */}
          <AppText
            numberOfLines={2}
            // Capped at 1: the meta column is ~119dp beside the status chip,
            // and a scaled-up "Morning (8am - 12pm)" does not fit even on its
            // own line.
            maxFontSizeMultiplier={1}
            style={styles.meta}
          >
            {formatDate(booking.preferredDate) || 'Date TBD'}
            {booking.preferredTimeSlot ? ` • ${booking.preferredTimeSlot}` : ''}
          </AppText>
        </View>
      </View>

      <View style={styles.cardTail}>
        <View style={[styles.chip, { backgroundColor: tone.bg }]}>
          {/* No numberOfLines: "Awaiting your confirmation" is 26 characters and
              is meant to wrap inside the 100pt column rather than truncate. */}
          <AppText weight="semibold" style={[styles.chipLabel, { color: tone.fg }]}>
            {tone.label}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={17} color={colors.inkFaint} />
      </View>
    </Pressable>
  );
}

export default function Bookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('active');
  const { data, isLoading, isError, refetch, isRefetching } = useBookings();

  const counts = useMemo(() => {
    const all = data ?? [];
    return {
      active: all.filter((b) => inTab(b.status, 'active')).length,
      completed: all.filter((b) => inTab(b.status, 'completed')).length,
      cancelled: all.filter((b) => inTab(b.status, 'cancelled')).length,
    };
  }, [data]);

  const visible = useMemo(
    () => (data ?? []).filter((b) => inTab(b.status, tab)),
    [data, tab],
  );

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <AppText weight="semibold" style={styles.title}>
          Bookings
        </AppText>
        <AppText weight="medium" style={styles.subtitle}>
          Track and manage all your bookings
        </AppText>
      </View>

      <View style={styles.filters}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(t.id)}
              // No android_ripple: the fill change IS the feedback, and the
              // canvas draws no ripple. (A function `style` would be worse
              // still — with the React Compiler on it renders no style at all.)
              style={[styles.filter, active ? styles.filterOn : styles.filterOff]}
            >
              <AppText
                weight="semibold"
                numberOfLines={1}
                // 1, not AppText's 1.1: three filters plus their counts need
                // every point of a 360dp row, and a scaled-up label truncates
                // to "Complet…" rather than overflowing gracefully.
                maxFontSizeMultiplier={1}
                style={[
                  styles.filterLabel,
                  active ? styles.filterLabelOn : styles.filterLabelOff,
                ]}
              >
                {t.label}
              </AppText>
              <View style={[styles.count, active ? styles.countOn : styles.countOff]}>
                <AppText
                  weight="semibold"
                  maxFontSizeMultiplier={1}
                  style={[
                    styles.countLabel,
                    active ? styles.countLabelOn : styles.countLabelOff,
                  ]}
                >
                  {String(t.count)}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.accentDeep} />
        </View>
      ) : isError ? (
        <View style={styles.centre}>
          <AppText style={styles.errorText}>
            Couldn’t load your bookings. Pull to refresh.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(b) => b.id}
          // The tab bar floats over the list, so the last card needs to clear it.
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingBottom: Math.max(insets.bottom, 14) + 88,
          }}
          ItemSeparatorComponent={Separator}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accentDeep}
              colors={[colors.accentDeep]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={30} color={colors.accentDeep} />
              </View>
              <AppText weight="semibold" style={styles.emptyTitle}>
                No {tab} bookings
              </AppText>
              <AppText style={styles.emptyBody}>
                {tab === 'active'
                  ? 'Find an artisan and request a service. It’ll show up here.'
                  : `You have no ${tab} bookings yet.`}
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => router.push(`/booking/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.sand,
  },

  header: {
    gap: 4,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 16,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    // Display size, so it has room for the tracking. The small labels below
    // deliberately have none — Android clips a tightly-tracked short run.
    letterSpacing: -1.08,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.inkMuted,
  },

  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  // The canvas draws these hugging their labels, which fits its 390pt artboard
  // and does not fit a 360dp phone — "Completed" clipped and "Cancelled" ran
  // off the edge. Sharing the row equally keeps all three filters visible at
  // any width, and at any font scale, which is what the design is actually
  // asking for.
  filter: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: 999,
    overflow: 'hidden',
    // Both states carry a border, the active one in its own fill colour, so
    // it is invisible. This is load-bearing, not decoration: with the border
    // only on the inactive style, a chip that transitioned off → on painted
    // its orange pill and nothing else — label and count were both in the
    // view tree at the right bounds and simply never drew. Keeping
    // borderWidth constant and changing only borderColor fixes it.
    borderWidth: 1,
  },
  filterOn: {
    backgroundColor: colors.accentDeep,
    borderColor: colors.accentDeep,
  },
  filterOff: {
    backgroundColor: colors.white,
    borderColor: colors.hairline,
  },
  filterLabel: {
    flexShrink: 1,
    fontSize: 12,
  },
  filterLabelOn: {
    color: colors.white,
  },
  filterLabelOff: {
    color: colors.inkMuted,
  },
  count: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countOn: {
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  countOff: {
    backgroundColor: colors.sandSunk,
  },
  countLabel: {
    fontSize: 10.5,
  },
  countLabelOn: {
    color: colors.white,
  },
  countLabelOff: {
    color: colors.inkFaint,
  },

  separator: {
    height: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cardIcon: {
    width: 48,
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.accentTint,
  },
  cardBody: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    gap: 3,
  },
  service: {
    fontSize: 15.5,
    letterSpacing: -0.31,
    color: colors.ink,
  },
  artisan: {
    fontSize: 12.5,
    color: colors.accentDeep,
  },
  metaRow: {
    flexDirection: 'row',
    // Top, not centre: the meta text can run to two lines and the calendar
    // glyph should sit with the first of them.
    alignItems: 'flex-start',
    gap: 5,
  },
  meta: {
    // Stretches to the row's remaining width rather than shrink-wrapping to
    // its own measure, which is what lets Android clip the final glyph.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.inkFaint,
  },
  cardTail: {
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: 100,
    alignItems: 'flex-end',
    gap: 7,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipLabel: {
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'right',
  },

  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.inkMuted,
  },

  empty: {
    marginTop: 76,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  emptyTitle: {
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.57,
    color: colors.ink,
  },
  emptyBody: {
    marginTop: 4,
    maxWidth: 256,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.inkMuted,
  },
});
