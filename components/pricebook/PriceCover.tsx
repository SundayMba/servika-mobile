import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';

import { FALLBACK_CATEGORIES } from '@/constants/fallback-categories';
import { categoryImage } from '@/lib/catalogue/assets';
import { config } from '@/lib/config';

/** Cut-out photos of Servika artisans at work, used as the cover until ops upload a real one. */
const AT_WORK: Record<string, ImageSourcePropType> = {
  ac: require('@assets/images/artisans/working/v2/hero_ac.webp'),
  electrical: require('@assets/images/artisans/working/v2/hero_electrician.webp'),
  plumbing: require('@assets/images/artisans/working/v2/hero_plumber.webp'),
  fridge: require('@assets/images/artisans/working/v2/hero_fridge.webp'),
  carpentry: require('@assets/images/artisans/working/v2/hero_carpenter.webp'),
};

const TINTS = Object.fromEntries(FALLBACK_CATEGORIES.map((c) => [c.slug, c.tint]));

/**
 * The cover for a price-book job. The photo ops uploaded wins; until then a placeholder that still
 * says what the job is: an artisan of that trade at work, or the trade's artwork, on a soft wash of
 * the category's colour.
 */
function PriceCoverBase({
  photoUrl,
  categorySlug,
  style,
  compact = false,
  side = 'center',
}: {
  photoUrl: string | null | undefined;
  categorySlug: string;
  style?: StyleProp<ViewStyle>;
  /** A small thumbnail: the artwork alone reads better than a tiny person. */
  compact?: boolean;
  /** Where the placeholder subject sits. 'right' leaves the left side free for text (banners). */
  side?: 'center' | 'right';
}) {
  const tint = TINTS[categorySlug] ?? '#E4620A';
  if (photoUrl) {
    return (
      <View style={[styles.frame, style]}>
        <Image
          source={{ uri: `${config.apiBaseUrl}${photoUrl}` }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          recyclingKey={photoUrl}
        />
      </View>
    );
  }

  const person = compact ? undefined : AT_WORK[categorySlug];
  const art = categoryImage(categorySlug);
  return (
    <View style={[styles.frame, { backgroundColor: `${tint}24` }, style]}>
      {/* A soft disc of the tint behind the subject gives the flat wash some depth. */}
      <View style={[styles.disc, { backgroundColor: `${tint}26` }]} />
      {person ? (
        <Image source={person} style={styles.person} contentFit="contain" contentPosition="bottom" transition={0} />
      ) : art ? (
        <Image
          source={art}
          style={compact ? styles.artCompact : side === 'right' ? styles.artRight : styles.art}
          contentFit="contain"
          transition={0}
        />
      ) : null}
    </View>
  );
}

export const PriceCover = memo(PriceCoverBase);

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  disc: { position: 'absolute', width: '90%', aspectRatio: 1, borderRadius: 9999, right: '-18%', bottom: '-30%' },
  person: { position: 'absolute', right: '-4%', bottom: 0, width: '78%', height: '96%' },
  art: { width: '62%', height: '62%' },
  artCompact: { width: '78%', height: '78%' },
  artRight: { position: 'absolute', right: '5%', width: '42%', height: '80%' },
});
