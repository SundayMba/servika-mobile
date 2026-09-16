import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';

/**
 * Loading skeletons for the Home sections, matched to the v2 shapes — 66pt
 * tiles, 226pt artisan cards, hairline borders. They mirror the real geometry
 * so content lands without the page jumping, on first load and on pull-to-
 * refresh alike.
 *
 * One shared pulse drives every block: each Skeleton animating its own value
 * would put dozens of timers on the UI thread for a screen that is, by
 * definition, already waiting on the network.
 */

const PULSE_MS = 800;

/** A single block that gently pulses while data loads. */
export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[styles.block, style, animated]} />;
}

/** Matches the 4-across Popular Services grid (tile + label). */
export function ServiceGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.gridCell}>
          <Skeleton style={styles.tile} />
          <Skeleton style={styles.tileLabel} />
        </View>
      ))}
    </View>
  );
}

/** A list of rows (avatar + two lines), for the artisans and similar list screens. */
export function ListRowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton style={{ width: 56, height: 56, borderRadius: 16 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ height: 14, width: '55%' }} />
            <Skeleton style={{ height: 11, width: '80%' }} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** A two-column grid of cards (photo + two lines), for the services screen. */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 22, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: '47%', gap: 8 }}>
          <Skeleton style={{ aspectRatio: 1, borderRadius: 18 }} />
          <Skeleton style={{ height: 13, width: '70%' }} />
          <Skeleton style={{ height: 11, width: '45%' }} />
        </View>
      ))}
    </View>
  );
}

/** Matches the horizontal Nearby Artisans carousel. */
export function ArtisanCarouselSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.carousel}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <Skeleton style={styles.cardMedia} />
          <View style={styles.cardBody}>
            <Skeleton style={styles.line16} />
            <Skeleton style={styles.line12} />
            <View style={styles.cardActions}>
              <Skeleton style={styles.actionWide} />
              <Skeleton style={styles.actionNarrow} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Stands in for the resume card while a signed-in user's bookings load. */
export function ActiveBookingSkeleton() {
  return (
    <View style={styles.resume}>
      <Skeleton style={styles.resumeIcon} />
      <View style={styles.resumeCopy}>
        <Skeleton style={styles.line14} />
        <Skeleton style={styles.line10} />
      </View>
      <Skeleton style={styles.resumeAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E4E4DF',
    borderRadius: 8,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 22,
    paddingHorizontal: 22,
  },
  gridCell: {
    width: '25%',
    alignItems: 'center',
    gap: 9,
  },
  tile: {
    width: 66,
    height: 66,
    borderRadius: 20,
  },
  tileLabel: {
    width: 44,
    height: 9,
    borderRadius: 999,
  },

  carousel: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 22,
  },
  card: {
    width: 226,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cardMedia: {
    height: 158,
    borderRadius: 0,
  },
  cardBody: {
    padding: 13,
    paddingBottom: 14,
    gap: 10,
  },
  line16: { width: 120, height: 12, borderRadius: 999 },
  line12: { width: 156, height: 10, borderRadius: 999 },
  line14: { width: 130, height: 11, borderRadius: 999 },
  line10: { width: 90, height: 9, borderRadius: 999 },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionWide: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    height: 42,
    borderRadius: 13,
  },
  actionNarrow: { width: 74, height: 42, borderRadius: 13 },

  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 22,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  resumeIcon: { width: 44, height: 44, borderRadius: 14 },
  resumeCopy: { flexGrow: 1, flexShrink: 1, flexBasis: 0, gap: 7 },
  resumeAction: { width: 66, height: 34, borderRadius: 11 },
});
