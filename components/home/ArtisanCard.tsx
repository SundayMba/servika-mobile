import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/** Minimal shape an artisan card needs — works for static and API-backed data. */
export type ArtisanCardItem = {
  name: string;
  specialty: string;
  available: boolean;
  rating: number;
  distanceKm: number;
  avatar?: ImageSourcePropType;
};

/**
 * Artisan card for the Home carousel, per the v2 design: a hairline-bordered
 * white card with no shadow, and specialty, rating and distance folded onto one
 * meta line so the card gets shorter without losing anything.
 */
function ArtisanCardBase({
  artisan,
  onPress,
  onBook,
  onChat,
}: {
  artisan: ArtisanCardItem;
  onPress?: () => void;
  onBook?: () => void;
  onChat?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${artisan.name}, ${artisan.specialty}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.media}>
        <Image
          source={artisan.avatar}
          contentFit="cover"
          contentPosition="top"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badge}>
          <View
            style={[
              styles.badgeDot,
              { backgroundColor: artisan.available ? colors.online : '#D1D5DB' },
            ]}
          />
          <AppText
            weight="semibold"
            style={[
              styles.badgeLabel,
              { color: artisan.available ? colors.onlineInk : colors.inkSubtle },
            ]}
          >
            {artisan.available ? 'Available' : 'Busy'}
          </AppText>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <AppText weight="semibold" numberOfLines={1} style={styles.name}>
              {artisan.name}
            </AppText>
            <MaterialCommunityIcons
              name="check-decagram"
              size={14}
              color={colors.accentDeep}
            />
          </View>

          <View style={styles.metaRow}>
            <AppText weight="medium" numberOfLines={1} style={styles.specialty}>
              {artisan.specialty}
            </AppText>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={12} color={colors.accentDeep} />
              <AppText weight="medium" style={styles.metaValue}>
                {artisan.rating.toFixed(1)}
              </AppText>
            </View>
            <View style={styles.metaItemTight}>
              <Ionicons name="location-outline" size={12} color={colors.inkSubtle} />
              <AppText style={styles.metaMuted}>{`${artisan.distanceKm} km`}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Book ${artisan.name}`}
            onPress={onBook}
            android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            style={styles.book}
          >
            <AppText weight="semibold" style={styles.bookLabel}>
              Book now
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${artisan.name}`}
            onPress={onChat}
            android_ripple={{ color: 'rgba(20,23,27,0.06)' }}
            style={styles.chat}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={15}
              color={colors.accentDeep}
            />
            <AppText weight="semibold" style={styles.chatLabel}>
              Chat
            </AppText>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export const ArtisanCard = memo(ArtisanCardBase);

const styles = StyleSheet.create({
  card: {
    width: 226,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  media: {
    height: 158,
    backgroundColor: colors.sand,
    // Android will not clip a child to the parent's radius once the parent has
    // a border, so the image corners have to be rounded here. Inset by the
    // 1pt border so the curves sit concentric with the card's.
    borderTopLeftRadius: 21,
    borderTopRightRadius: 21,
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
  },
  badgeLabel: {
    fontSize: 9.5,
    letterSpacing: 0.19,
  },
  body: {
    padding: 13,
    paddingBottom: 14,
    gap: 10,
  },
  identity: {
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    flexShrink: 1,
    fontSize: 15.5,
    letterSpacing: -0.31,
    color: colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemTight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  specialty: {
    flexShrink: 1,
    fontSize: 12.5,
    color: colors.accentDeep,
  },
  metaValue: {
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  metaMuted: {
    fontSize: 12.5,
    color: colors.inkSubtle,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  book: {
    // flexGrow with an explicit basis, not `flex: 1` — the shorthand alongside a
    // row gap has failed to resolve a width on Android in this codebase before.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.accentDeep,
  },
  bookLabel: {
    fontSize: 13.5,
    letterSpacing: -0.135,
    color: colors.white,
  },
  chat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    backgroundColor: colors.white,
  },
  chatLabel: {
    fontSize: 13.5,
    color: colors.accentDeep,
  },
});
