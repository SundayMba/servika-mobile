import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { formatNaira } from '@/lib/catalogue/assets';
import { distanceLabel } from '@/lib/catalogue/display';
import type { FeaturedService, ServiceSection } from '@/lib/catalogue/types';
import { config } from '@/lib/config';

const GAP = 12;

/** Work photo for a post with no cover of its own, so a card never shows an empty box. */
const TRADE_ART: Record<string, ImageSourcePropType> = {
  electrical: require('@assets/images/artisans/working/hero_electrician.webp'),
  electronics: require('@assets/images/artisans/working/hero_electrician.webp'),
  plumbing: require('@assets/images/artisans/working/hero_plumber.webp'),
  'water-pump': require('@assets/images/artisans/working/hero_plumber.webp'),
  ac: require('@assets/images/artisans/working/hero_ac.webp'),
  fridge: require('@assets/images/artisans/working/hero_fridge.webp'),
  appliance: require('@assets/images/artisans/working/hero_fridge.webp'),
  carpentry: require('@assets/images/artisans/working/hero_carpenter.webp'),
};

/** Cover priority: the post's own (checked by ops) → trade art → none. Never the artisan's face. */
export function serviceCover(item: FeaturedService): ImageSourcePropType | { uri: string } | null {
  if (item.photoUrl) return { uri: `${config.apiBaseUrl}${item.photoUrl}` };
  if (item.categorySlug && TRADE_ART[item.categorySlug]) return TRADE_ART[item.categorySlug];
  return null;
}

export function durationLabel(minutes?: number | null) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr${h > 1 ? 's' : ''}`;
}

function ServiceCardBase({ item, width, onPress }: { item: FeaturedService; width: number; onPress: () => void }) {
  const cover = serviceCover(item);
  const meta = [durationLabel(item.durationMinutes), distanceLabel(item.distanceKm)].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatNaira(item.priceNaira)}, by ${item.artisanName}`}
      onPress={onPress}
      style={[styles.card, { width }]}
    >
      <View style={[styles.media, { height: Math.round(width * 0.72) }]}>
        {cover ? (
          <Image source={cover} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} transition={150} />
        ) : (
          <View style={styles.mediaFallback}>
            <Ionicons name="construct-outline" size={28} color={colors.accentDeep} />
          </View>
        )}
        <View style={styles.pricePill}>
          <AppText weight="semibold" style={styles.priceLabel}>{formatNaira(item.priceNaira)}</AppText>
        </View>
      </View>
      <View style={styles.body}>
        <AppText weight="semibold" numberOfLines={1} style={styles.name}>{item.name}</AppText>
        <View style={styles.provider}>
          <View style={styles.avatar}>
            {item.artisanPhotoUrl ? (
              <Image source={{ uri: `${config.apiBaseUrl}${item.artisanPhotoUrl}` }} contentFit="cover" contentPosition="top" style={{ flex: 1 }} />
            ) : (
              <AppText weight="semibold" style={styles.avatarLetter}>{item.artisanName.charAt(0).toUpperCase()}</AppText>
            )}
          </View>
          <AppText weight="medium" numberOfLines={1} style={styles.providerName}>{item.artisanName}</AppText>
          <Ionicons name="shield-checkmark" size={12} color={colors.onlineInk} />
        </View>
        {meta ? <AppText numberOfLines={1} style={styles.meta}>{meta}</AppText> : null}
      </View>
    </Pressable>
  );
}

export const ServiceCard = memo(ServiceCardBase);

export function useServiceCardWidth() {
  const { width } = useWindowDimensions();
  return Math.min(240, Math.max(196, Math.round(width * 0.56)));
}

/** One trade's row under Home's "Standard services": the trade as a subheading, "See all", and the posts side by side. */
export function ServiceSectionRow({
  section,
  gutter,
  onOpen,
  onSeeAll,
}: {
  section: ServiceSection;
  gutter: number;
  onOpen: (item: FeaturedService) => void;
  onSeeAll: () => void;
}) {
  const width = useServiceCardWidth();
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.head, { paddingHorizontal: gutter }]}>
        <AppText weight="semibold" numberOfLines={1} style={styles.title}>{section.categoryName}</AppText>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onSeeAll}>
          <AppText weight="medium" style={styles.seeAll}>See all</AppText>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={width + GAP}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP }}
      >
        {section.services.map((s) => (
          <ServiceCard key={s.serviceId} item={s} width={width} onPress={() => onOpen(s)} />
        ))}
      </ScrollView>
    </View>
  );
}

/** One post as a list row: cover, name, artisan · duration · distance, price. */
export function ServiceListRow({ item, first, onPress }: { item: FeaturedService; first: boolean; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const cover = serviceCover(item);
  const meta = [item.artisanName, durationLabel(item.durationMinutes), distanceLabel(item.distanceKm)].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatNaira(item.priceNaira)}`}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[listStyles.row, !first && listStyles.rowDivider, pressed && listStyles.rowPressed]}
    >
      <View style={listStyles.thumb}>
        {cover ? <Image source={cover} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} /> : <Ionicons name="construct-outline" size={22} color={colors.accentDeep} />}
      </View>
      <View style={listStyles.rowBody}>
        <AppText weight="semibold" numberOfLines={2} style={listStyles.rowName}>{item.name}</AppText>
        <AppText numberOfLines={1} style={listStyles.rowMeta}>{meta}</AppText>
      </View>
      <View style={listStyles.rowPrice}>
        <AppText weight="semibold" style={listStyles.price}>{formatNaira(item.priceNaira)}</AppText>
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      </View>
    </Pressable>
  );
}

export function ServiceSectionSkeleton({ gutter }: { gutter: number }) {
  const width = useServiceCardWidth();
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.skelTitle, { marginHorizontal: gutter }]} />
      <View style={{ flexDirection: 'row', gap: GAP, paddingHorizontal: gutter }}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.skelCard, { width, height: Math.round(width * 0.72) + 76 }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { flexGrow: 1, flexShrink: 1, flexBasis: 0, fontSize: 15.5, letterSpacing: -0.2, color: colors.inkMuted },
  seeAll: { fontSize: 13, color: colors.accentDeep },
  card: { borderRadius: 20, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  // Android won't clip a child to a bordered parent's radius, so the photo rounds its own corners.
  media: { borderTopLeftRadius: 19, borderTopRightRadius: 19, overflow: 'hidden', backgroundColor: colors.sand },
  mediaFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint },
  pricePill: { position: 'absolute', left: 10, bottom: 10, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(20,23,27,0.92)' },
  priceLabel: { fontSize: 13, color: colors.white },
  body: { padding: 11, gap: 6 },
  name: { fontSize: 14.5, color: colors.ink },
  provider: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatar: { width: 20, height: 20, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint },
  avatarLetter: { fontSize: 9.5, color: colors.accentDeep },
  providerName: { flexShrink: 1, fontSize: 12.5, color: colors.inkMuted },
  meta: { fontSize: 12, color: colors.inkSubtle },
  skelTitle: { width: 190, height: 18, borderRadius: 6, backgroundColor: colors.hairline },
  skelCard: { borderRadius: 20, backgroundColor: colors.hairline },
});

const listStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  rowPressed: { backgroundColor: '#FBFAF8' },
  thumb: { width: 64, height: 64, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint },
  rowBody: { flex: 1, gap: 4 },
  rowName: { fontSize: 14.5, color: colors.ink },
  rowMeta: { fontSize: 12, color: colors.inkSubtle },
  rowPrice: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 15, color: colors.ink },
});
