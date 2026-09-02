import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { config } from '@/lib/config';
import { formatNaira } from '@/lib/catalogue/assets';
import type { FeaturedService } from '@/lib/catalogue/types';

/**
 * One card on the Home fixed-price rail: the service's own showcase photo (the
 * work itself), the price, and just enough of the artisan to trust the tap.
 * Booking goes straight into the existing fixed-price flow (pay after the
 * artisan accepts) — no quote round-trip.
 */
function FixedPriceCardBase({
  item,
  onBook,
  onArtisan,
}: {
  item: FeaturedService;
  onBook: () => void;
  onArtisan: () => void;
}) {
  const photo = item.photoUrl ?? item.artisanPhotoUrl;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatNaira(item.priceNaira)} by ${item.artisanName}`}
      onPress={onBook}
      style={styles.card}
    >
      <View style={styles.media}>
        {photo ? (
          <Image
            source={{ uri: `${config.apiBaseUrl}${photo}` }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            transition={120}
          />
        ) : (
          <View style={styles.mediaFallback}>
            <Ionicons name="pricetags" size={26} color={colors.accentDeep} />
          </View>
        )}
        <View style={styles.priceBadge}>
          <AppText weight="semibold" style={styles.priceLabel}>
            {formatNaira(item.priceNaira)}
          </AppText>
        </View>
      </View>

      <View style={styles.body}>
        <AppText weight="semibold" numberOfLines={1} style={styles.name}>
          {item.name}
        </AppText>
        <Pressable accessibilityRole="button" onPress={onArtisan} hitSlop={6} style={styles.artisanRow}>
          <AppText numberOfLines={1} style={styles.artisan}>
            {item.artisanName}
          </AppText>
          {item.hasCertificate ? (
            <Ionicons name="ribbon" size={11} color={colors.primary} />
          ) : null}
          <Ionicons name="star" size={11} color={colors.accentDeep} />
          <AppText style={styles.meta}>
            {item.rating.toFixed(1)}
            {item.distanceKm != null ? ` · ${item.distanceKm} km` : ''}
          </AppText>
        </Pressable>
        <View style={styles.bookBtn}>
          <AppText weight="semibold" style={styles.bookLabel}>
            Book now
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const FixedPriceCard = memo(FixedPriceCardBase);

/** The horizontal rail. Renders nothing while there is nothing to show. */
export function FixedPriceRail({
  items,
  onBook,
  onArtisan,
}: {
  items: FeaturedService[];
  onBook: (item: FeaturedService) => void;
  onArtisan: (item: FeaturedService) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {items.map((item) => (
        <FixedPriceCard
          key={item.serviceId}
          item={item}
          onBook={() => onBook(item)}
          onArtisan={() => onArtisan(item)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 172,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  media: {
    height: 110,
    backgroundColor: colors.sand,
  },
  mediaFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E4',
  },
  priceBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  priceLabel: {
    fontSize: 12,
    color: colors.ink,
  },
  body: {
    padding: 10,
    gap: 5,
  },
  name: {
    fontSize: 13,
    color: colors.ink,
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  artisan: {
    flexShrink: 1,
    fontSize: 11.5,
    color: colors.inkMuted,
  },
  meta: {
    fontSize: 11,
    color: colors.inkMuted,
  },
  bookBtn: {
    marginTop: 2,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  bookLabel: {
    fontSize: 12.5,
    color: colors.white,
  },
});
