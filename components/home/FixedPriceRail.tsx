import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { memo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { config } from '@/lib/config';
import { formatNaira } from '@/lib/catalogue/assets';
import type { FeaturedService } from '@/lib/catalogue/types';

/** Home's horizontal gutter and the gap between cards. */
const GUTTER = 22;
const GAP = 12;

type Source = ImageSourcePropType | { uri: string } | null;

/**
 * One card's worth of display data. Live listings come from the services API
 * via `toFixedPriceCard`; the rail shows only what real artisans have published.
 */
export type FixedPriceCardItem = {
  key: string;
  name: string;
  priceNaira: number;
  /** The service's own photo, trade art for its category, the artisan's photo, or null → tag tile. */
  source: Source;
  rating: number;
  reviewCount: number;
  /** Km from the customer's selected area; null when either side has no pin. */
  distanceKm: number | null;
  /** The provider line. */
  providerName?: string;
  providerSource?: Source;
  available?: boolean;
  certified?: boolean;
  /** The live listing; the tap opens the service profile. */
  service?: FeaturedService;
};

/**
 * Placeholder artwork while a live service has no photo of its own: a real
 * work photo from the artisan's trade, so the card never shows an empty grey
 * box (the artisan's own photo is a face, not the work — the card leads with
 * the work).
 */
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

/** Photo priority: the service's own → trade art for its category → artisan photo → none. */
export function serviceArt(item: FeaturedService): Source {
  if (item.photoUrl) return { uri: `${config.apiBaseUrl}${item.photoUrl}` };
  if (item.categorySlug && TRADE_ART[item.categorySlug]) return TRADE_ART[item.categorySlug];
  if (item.artisanPhotoUrl) return { uri: `${config.apiBaseUrl}${item.artisanPhotoUrl}` };
  return null;
}

export function toFixedPriceCard(item: FeaturedService): FixedPriceCardItem {
  return {
    key: item.serviceId,
    name: item.name,
    priceNaira: item.priceNaira,
    source: serviceArt(item),
    rating: item.rating,
    reviewCount: item.reviewCount,
    distanceKm: item.distanceKm,
    providerName: item.artisanName,
    providerSource: item.artisanPhotoUrl
      ? { uri: `${config.apiBaseUrl}${item.artisanPhotoUrl}` }
      : null,
    available: item.isAvailable,
    certified: item.hasCertificate,
    service: item,
  };
}

/**
 * Card width. On the rail a card takes about two thirds of the screen so the
 * next one peeks (room for the info block); on the list screen it spans the
 * full content width.
 */
export function useFixedPriceCardWidth(layout: 'rail' | 'list' = 'rail') {
  const { width } = useWindowDimensions();
  if (layout === 'list') return width - GUTTER * 2;
  return Math.min(300, Math.max(232, Math.round(width * 0.68)));
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/**
 * The card, housed like the artisan card: a hairline-bordered white card, the
 * work photo on top with a dark price pill on its corner, then an info block —
 * name, star rating with count, distance, and the provider with a verified tick.
 */
function FixedPriceCardBase({
  item,
  width,
  onPress,
}: {
  item: FixedPriceCardItem;
  width: number;
  onPress: () => void;
}) {
  // Taller than a photo card's usual 16:10 so an uploaded portrait keeps its subject;
  // anchored to the top because faces and the work sit in the upper part of the shot.
  const mediaHeight = Math.round(width * 0.8);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatNaira(item.priceNaira)}`}
      onPress={onPress}
      style={[styles.card, { width }]}
    >
      <View style={[styles.media, { height: mediaHeight }]}>
        {item.source ? (
          <Image source={item.source} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} transition={150} />
        ) : (
          <View style={styles.mediaFallback}>
            <Ionicons name="pricetags" size={28} color={colors.accentDeep} />
          </View>
        )}

        <View style={styles.pricePill}>
          <AppText weight="semibold" style={styles.priceLabel}>
            {formatNaira(item.priceNaira)}
          </AppText>
        </View>

        <View style={styles.tagRow}>
          <View style={styles.topTag}>
            <Ionicons name="shield-checkmark" size={10} color="#15803D" />
            <AppText weight="semibold" style={[styles.topTagLabel, { color: '#15803D' }]}>
              Fixed price
            </AppText>
          </View>
          {item.certified ? (
            <View style={styles.topTag}>
              <Ionicons name="ribbon" size={10} color={colors.accentDeep} />
              <AppText weight="semibold" style={styles.topTagLabel}>
                Certified
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <AppText weight="semibold" numberOfLines={1} style={styles.name}>
          {item.name}
        </AppText>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color="#FBBF24" />
          <AppText weight="semibold" style={styles.metaStrong}>
            {item.rating.toFixed(1)}
          </AppText>
          <AppText style={styles.metaMuted}>({item.reviewCount})</AppText>
          {item.distanceKm != null ? (
            <>
              <AppText style={styles.metaDot}>·</AppText>
              <Ionicons name="location-outline" size={13} color={colors.inkSubtle} />
              <AppText style={styles.metaMuted}>{item.distanceKm} km away</AppText>
            </>
          ) : null}
        </View>

        <View style={styles.providerRow}>
          {item.providerName ? (
            <>
              <View style={styles.providerAvatar}>
                {item.providerSource ? (
                  <Image
                    source={item.providerSource}
                    contentFit="cover"
                    contentPosition="top"
                    style={{ flex: 1 }}
                  />
                ) : (
                  <View style={styles.providerInitials}>
                    <AppText weight="semibold" style={styles.providerInitialsLabel}>
                      {initialsOf(item.providerName)}
                    </AppText>
                  </View>
                )}
              </View>
              <AppText weight="medium" numberOfLines={1} style={styles.providerName}>
                {item.providerName}
              </AppText>
              <MaterialCommunityIcons name="check-decagram" size={13} color="#3B82F6" />
              <View style={{ flex: 1 }} />
              <View
                style={[
                  styles.availDot,
                  { backgroundColor: item.available ? colors.online : '#D1D5DB' },
                ]}
              />
              <AppText
                weight="semibold"
                style={[
                  styles.availLabel,
                  { color: item.available ? colors.onlineInk : colors.inkSubtle },
                ]}
              >
                {item.available ? 'Available' : 'Busy'}
              </AppText>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const FixedPriceCard = memo(FixedPriceCardBase);

/** The horizontal rail of live fixed-price listings. */
export function FixedPriceRail({
  items,
  onPress,
}: {
  items: FixedPriceCardItem[];
  onPress: (item: FixedPriceCardItem) => void;
}) {
  const width = useFixedPriceCardWidth('rail');
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={width + GAP}
      snapToAlignment="start"
      contentContainerStyle={styles.rail}
    >
      {items.map((item) => (
        <FixedPriceCard key={item.key} item={item} width={width} onPress={() => onPress(item)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    paddingHorizontal: GUTTER,
    gap: GAP,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  media: {
    backgroundColor: colors.sand,
    // Android will not clip a child to the parent's radius once the parent has
    // a border, so the image corners are rounded here, inset by the 1pt border
    // so the curves sit concentric with the card's (same trick as ArtisanCard).
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    overflow: 'hidden',
  },
  mediaFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentTint,
  },
  pricePill: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(20,23,27,0.92)',
  },
  priceLabel: {
    fontSize: 13.5,
    color: colors.white,
  },
  tagRow: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    gap: 6,
  },
  topTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  topTagLabel: {
    fontSize: 9.5,
    letterSpacing: 0.19,
    color: colors.ink,
  },
  body: {
    padding: 12,
    paddingTop: 11,
    gap: 6,
  },
  name: {
    fontSize: 15.5,
    color: colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaStrong: {
    fontSize: 12.5,
    color: colors.ink,
  },
  metaMuted: {
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  metaDot: {
    marginHorizontal: 3,
    fontSize: 12.5,
    color: colors.inkFaint,
  },
  providerRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  providerAvatar: {
    height: 22,
    width: 22,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: colors.sand,
    marginRight: 2,
  },
  providerInitials: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentTint,
  },
  providerInitialsLabel: {
    fontSize: 9,
    color: colors.accentDeep,
  },
  providerName: {
    flexShrink: 1,
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availLabel: {
    fontSize: 10.5,
    letterSpacing: 0.19,
  },
});
