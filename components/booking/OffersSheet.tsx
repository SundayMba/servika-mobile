import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import type { Bid } from '@/lib/booking/types';
import { formatNaira } from '@/lib/catalogue/assets';
import { distanceLabel } from '@/lib/catalogue/display';
import { config } from '@/lib/config';

type Sort = 'price' | 'nearest' | 'jobs';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'price', label: 'Lowest price' },
  { key: 'nearest', label: 'Nearest' },
  { key: 'jobs', label: 'Most jobs' },
];

// Collapsed, only the handle and the summary row show.
const PEEK = 80;
const EASE = Easing.out(Easing.cubic);

/** A price bid is compared on its total; a visit bid on its visit fee, after every price bid of the same cost. */
function sortBids(bids: Bid[], sort: Sort): Bid[] {
  const far = Number.POSITIVE_INFINITY;
  const cost = (b: Bid) => (b.kind === 'VisitFirst' ? b.visitFeeNaira + 0.5 : b.amountNaira);
  return [...bids].sort((a, b) => {
    if (sort === 'nearest') return (a.distanceKm ?? far) - (b.distanceKm ?? far) || cost(a) - cost(b);
    if (sort === 'jobs') return b.completedJobs - a.completedJobs || cost(a) - cost(b);
    // Lowest price: priced offers first (you know the whole cost), then visit offers by fee.
    if (a.kind !== b.kind) return a.kind === 'Price' ? -1 : 1;
    return cost(a) - cost(b) || (a.distanceKm ?? far) - (b.distanceKm ?? far);
  });
}

function OfferCard({
  bid,
  cheapest,
  busy,
  onAccept,
  onCounter,
  onProfile,
}: {
  bid: Bid;
  cheapest: boolean;
  busy: boolean;
  onAccept: () => void;
  onCounter: () => void;
  onProfile: () => void;
}) {
  const visit = bid.kind === 'VisitFirst';
  const first = bid.artisanName.split(' ')[0];
  const canCounter = !visit && bid.counterRounds < bid.maxCounterRounds;
  const distance = distanceLabel(bid.distanceKm);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${bid.artisanName}'s profile`} onPress={onProfile} style={styles.avatar}>
          {bid.photoUrl ? (
            <Image source={{ uri: `${config.apiBaseUrl}${bid.photoUrl}` }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <AppText weight="semibold" style={styles.initial}>{bid.artisanName.trim().charAt(0).toUpperCase()}</AppText>
          )}
        </Pressable>
        <Pressable onPress={onProfile} style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <AppText weight="semibold" numberOfLines={1} style={styles.name}>{bid.artisanName}</AppText>
            {bid.hasCertificate ? <Ionicons name="ribbon" size={13} color={colors.accentDeep} /> : null}
          </View>
          <AppText numberOfLines={1} style={styles.meta}>
            ID checked · {bid.completedJobs > 0 ? `${bid.completedJobs} ${bid.completedJobs === 1 ? 'job' : 'jobs'} done` : 'New'}
            {distance ? ` · ${distance}` : ''}
          </AppText>
        </Pressable>
        <View style={{ alignItems: 'flex-end' }}>
          {visit ? (
            <>
              <AppText weight="semibold" style={styles.visitPrice}>{bid.visitFeeNaira > 0 ? formatNaira(bid.visitFeeNaira) : 'Free'}</AppText>
              <AppText style={styles.priceSub}>visit</AppText>
            </>
          ) : (
            <>
              <AppText weight="semibold" style={styles.price}>{formatNaira(bid.amountNaira)}</AppText>
              {cheapest ? <AppText weight="semibold" style={styles.cheapest}>Lowest</AppText> : null}
            </>
          )}
        </View>
      </View>

      {visit ? (
        <View style={styles.visitNote}>
          <Ionicons name="eye-outline" size={15} color="#9A5B07" />
          <AppText style={styles.visitText}>
            {first} needs to see the job before pricing it.{' '}
            {bid.visitFeeNaira > 0
              ? `You pay ${formatNaira(bid.visitFeeNaira)} for the visit, and it comes off the price.`
              : 'The visit is free.'}
          </AppText>
        </View>
      ) : (
        <View style={styles.breakdown}>
          <AppText style={styles.line}>Labour {formatNaira(bid.workmanshipNaira)}</AppText>
          {bid.materialsNaira > 0 ? <AppText style={styles.line}>· Materials {formatNaira(bid.materialsNaira)}</AppText> : null}
        </View>
      )}
      {bid.materialsNote ? <AppText numberOfLines={3} style={styles.note}>“{bid.materialsNote}”</AppText> : null}

      {bid.pendingCounterNaira != null ? (
        <View style={styles.counterStrip}>
          <Ionicons name="swap-horizontal" size={14} color="#2563EB" />
          <AppText style={styles.counterText}>
            You offered {formatNaira(bid.pendingCounterNaira)} labour · waiting for {first}
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        {canCounter && bid.pendingCounterNaira == null ? (
          <Pressable accessibilityRole="button" onPress={onCounter} style={styles.secondary}>
            <AppText weight="semibold" style={styles.secondaryLabel}>Offer less</AppText>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" disabled={busy} onPress={onAccept} style={[styles.primary, busy && { opacity: 0.6 }]}>
          <AppText weight="semibold" style={styles.primaryLabel}>
            {visit ? (bid.visitFeeNaira > 0 ? `Pick ${first} to visit` : `Pick ${first}, free visit`) : `Accept ${formatNaira(bid.amountNaira)}`}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * The offers on an open job, Uber-style: a sheet docked at the bottom that shows the count and the
 * lowest price, and slides up to list every artisan who answered. Each offer is either a price
 * (labour + materials) or "visit first" with the artisan's visit fee (or free). No stars: the
 * customer compares price, distance and jobs done on Servika.
 */
export function OffersSheet({
  bids,
  busy,
  onAccept,
  onCounter,
  onProfile,
}: {
  bids: Bid[];
  busy: boolean;
  onAccept: (bid: Bid) => void;
  onCounter: (bid: Bid) => void;
  onProfile: (bid: Bid) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: screen } = useWindowDimensions();
  const [sort, setSort] = useState<Sort>('price');
  const [open, setOpen] = useState(false);
  const full = Math.round(screen * 0.78);
  const peek = PEEK + Math.max(insets.bottom, 12);
  // translateY: 0 = fully open; full - peek = collapsed.
  const closedY = full - peek;
  const y = useSharedValue(closedY);
  const start = useSharedValue(0);

  const sorted = useMemo(() => sortBids(bids, sort), [bids, sort]);
  const priced = bids.filter((b) => b.kind === 'Price');
  const cheapest = priced.length > 1 ? priced.reduce((m, b) => (b.amountNaira < m.amountNaira ? b : m)) : null;
  const visits = bids.length - priced.length;

  const snap = (toOpen: boolean) => {
    y.value = withTiming(toOpen ? 0 : closedY, { duration: 300, easing: EASE });
    setOpen(toOpen);
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onStart(() => {
      start.value = y.value;
    })
    .onUpdate((e) => {
      y.value = Math.min(closedY, Math.max(0, start.value + e.translationY));
    })
    .onEnd((e) => {
      const toOpen = e.velocityY < -400 || (e.velocityY < 400 && y.value < closedY / 2);
      y.value = withTiming(toOpen ? 0 : closedY, { duration: 260, easing: EASE });
      runOnJS(setOpen)(toOpen);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: (1 - y.value / closedY) * 0.35 }));
  // The list only shows as the sheet comes up, so the collapsed sheet is just the summary row.
  const bodyStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.max(0, 1.4 - (y.value / closedY) * 1.6)) }));

  const summary =
    priced.length > 0
      ? `From ${formatNaira(Math.min(...priced.map((b) => b.amountNaira)))}${visits > 0 ? ` · ${visits} visit first` : ''}`
      : `${visits} ${visits === 1 ? 'artisan wants' : 'artisans want'} to see it first`;

  return (
    <>
      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={() => snap(false)} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { height: full }, sheetStyle]}>
        <GestureDetector gesture={pan}>
          <Pressable accessibilityRole="button" accessibilityLabel={open ? 'Hide offers' : 'Show offers'} onPress={() => snap(!open)} style={styles.head}>
            <View style={styles.handle} />
            <View style={styles.headRow}>
              <View style={{ flex: 1 }}>
                <AppText weight="semibold" style={styles.title}>
                  {bids.length} {bids.length === 1 ? 'offer' : 'offers'}
                </AppText>
                <AppText numberOfLines={1} style={styles.sub}>{summary}</AppText>
              </View>
              <View style={styles.toggle}>
                <AppText weight="semibold" style={styles.toggleLabel}>{open ? 'Hide' : 'See offers'}</AppText>
                <Ionicons name={open ? 'chevron-down' : 'chevron-up'} size={15} color={colors.white} />
              </View>
            </View>
          </Pressable>
        </GestureDetector>

        <Animated.View style={[{ flex: 1 }, bodyStyle]}>
        {bids.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.sorts}>
            {SORTS.filter((s) => s.key !== 'nearest' || bids.some((b) => b.distanceKm != null)).map((s) => (
              <Pressable key={s.key} accessibilityRole="button" onPress={() => setSort(s.key)} style={[styles.chip, sort === s.key && styles.chipOn]}>
                <AppText weight="semibold" style={[styles.chipLabel, sort === s.key && styles.chipLabelOn]}>{s.label}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 12 }} showsVerticalScrollIndicator={false}>
          {sorted.map((b) => (
            <OfferCard
              key={b.id}
              bid={b}
              cheapest={b.id === cheapest?.id}
              busy={busy}
              onAccept={() => onAccept(b)}
              onCounter={() => onCounter(b)}
              onProfile={() => onProfile(b)}
            />
          ))}
          <AppText style={styles.footer}>
            Pay only after you pick. The money is held by Servika until the job is done. Never pay an artisan outside the app.
          </AppText>
        </ScrollView>
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#000' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.sand,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  head: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairlineStrong, marginBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 18, color: colors.ink, letterSpacing: -0.3 },
  sub: { marginTop: 2, fontSize: 13, color: colors.inkMuted },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.accentDeep },
  toggleLabel: { fontSize: 13, color: colors.white },
  sorts: { gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  chip: { height: 34, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipLabel: { fontSize: 12.5, color: colors.inkMuted },
  chipLabelOn: { color: colors.white },

  card: { borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1E4' },
  initial: { fontSize: 17, color: colors.accentDeep },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { flexShrink: 1, fontSize: 15, color: colors.ink },
  meta: { marginTop: 2, fontSize: 12, color: colors.inkSubtle },
  price: { fontSize: 18, color: colors.ink },
  visitPrice: { fontSize: 17, color: '#9A5B07' },
  priceSub: { fontSize: 11.5, color: colors.inkSubtle },
  cheapest: { marginTop: 1, fontSize: 11, color: colors.onlineInk },
  breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 },
  line: { fontSize: 12.5, color: colors.inkMuted },
  visitNote: { flexDirection: 'row', gap: 7, marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: '#FFF6E0' },
  visitText: { flex: 1, fontSize: 12.5, lineHeight: 17, color: '#7A4A06' },
  note: { marginTop: 8, fontSize: 12.5, lineHeight: 17, color: colors.inkMuted },
  counterStrip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 9, borderRadius: 12, backgroundColor: '#EFF5FF' },
  counterText: { flex: 1, fontSize: 12, color: colors.ink },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondary: { flex: 1, height: 44, alignItems: 'stretch', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.hairlineStrong },
  secondaryLabel: { fontSize: 13.5, textAlign: 'center', color: colors.ink },
  primary: { flex: 1.4, height: 44, alignItems: 'stretch', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.accentDeep },
  primaryLabel: { fontSize: 13.5, textAlign: 'center', color: colors.white },
  footer: { marginTop: 4, fontSize: 12, lineHeight: 17, textAlign: 'center', color: colors.inkSubtle },
});
