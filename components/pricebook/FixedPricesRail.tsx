import { memo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { PriceCover } from '@/components/pricebook/PriceCover';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { formatNaira } from '@/lib/catalogue/assets';
import { durationLabel } from '@/lib/pricebook/hooks';
import type { PriceBookItem } from '@/lib/pricebook/types';

const GAP = 12;

/** Card width: about two-thirds of the screen, so the next card peeks and says "scroll". */
function useCardWidth(gutter: number) {
  const { width } = useWindowDimensions();
  return Math.round(Math.min(280, Math.max(220, (width - gutter * 2) * 0.68)));
}

function FixedPriceCardBase({ item, width, onPress }: { item: PriceBookItem; width: number; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const duration = durationLabel(item.durationMinutes);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatNaira(item.priceNaira ?? 0)}`}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.card, { width }, pressed && styles.pressed]}
    >
      <View>
        <PriceCover photoUrl={item.photoUrl} categorySlug={item.categorySlug} style={styles.cover} />
        <View style={styles.pricePill}>
          <AppText weight="semibold" style={styles.priceText}>{formatNaira(item.priceNaira ?? 0)}</AppText>
        </View>
        <View style={styles.tradePill}>
          <AppText weight="medium" numberOfLines={1} style={styles.tradeText}>{item.categoryName}</AppText>
        </View>
      </View>
      <View style={styles.body}>
        <AppText weight="semibold" numberOfLines={1} style={styles.name}>{item.name}</AppText>
        <AppText numberOfLines={2} style={styles.scope}>{item.scope}</AppText>
        {duration ? <AppText style={styles.meta}>{duration}</AppText> : null}
      </View>
    </Pressable>
  );
}

const FixedPriceCard = memo(FixedPriceCardBase);

/**
 * "Fixed prices" on Home: Servika's popular fixed-price jobs as a horizontal rail. Each card is the
 * job, its Servika price and what it covers; a tap opens the job. Renders nothing when there is
 * nothing to show (Home never prints an error).
 */
export function FixedPricesRail({
  items,
  gutter,
  onOpen,
}: {
  items: PriceBookItem[];
  gutter: number;
  onOpen: (item: PriceBookItem) => void;
}) {
  const cardWidth = useCardWidth(gutter);
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={cardWidth + GAP}
      snapToAlignment="start"
      contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP }}
    >
      {items.map((item) => (
        <FixedPriceCard key={item.id} item={item} width={cardWidth} onPress={() => onOpen(item)} />
      ))}
    </ScrollView>
  );
}

/** Placeholder cards while the rail loads. */
export function FixedPricesRailSkeleton({ gutter }: { gutter: number }) {
  const cardWidth = useCardWidth(gutter);
  return (
    <View style={{ flexDirection: 'row', gap: GAP, paddingHorizontal: gutter, overflow: 'hidden' }}>
      {[0, 1].map((i) => (
        <View key={i} style={[styles.card, { width: cardWidth }]}>
          <View style={[styles.cover, { backgroundColor: colors.sandSunk }]} />
          <View style={styles.body}>
            <View style={[styles.bar, { width: '70%' }]} />
            <View style={[styles.bar, { width: '90%', height: 10 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden' },
  pressed: { transform: [{ scale: 0.98 }] },
  cover: { width: '100%', aspectRatio: 16 / 11 },
  pricePill: { position: 'absolute', left: 10, bottom: 10, paddingHorizontal: 11, height: 30, justifyContent: 'center', borderRadius: 999, backgroundColor: colors.ink },
  priceText: { fontSize: 14, color: colors.white },
  tradePill: { position: 'absolute', left: 10, top: 10, maxWidth: '70%', paddingHorizontal: 9, height: 24, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.92)' },
  tradeText: { fontSize: 11, color: colors.ink },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14, gap: 4 },
  name: { fontSize: 15, letterSpacing: -0.2, color: colors.ink },
  scope: { fontSize: 12.5, lineHeight: 17, color: colors.inkMuted, minHeight: 34 },
  meta: { fontSize: 11.5, color: colors.inkSubtle, marginTop: 2 },
  bar: { height: 13, borderRadius: 6, backgroundColor: colors.sandSunk },
});
