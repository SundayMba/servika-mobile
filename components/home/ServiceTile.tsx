import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/** Minimal shape a tile needs — works for both static and API-backed data. */
export type ServiceTileItem = {
  label: string;
  image?: ImageSourcePropType;
};

/**
 * A category tile on Home, per the v2 design: a white pad on the sand ground
 * with a hairline instead of the old shadow, and the artwork sized down so the
 * grid reads as a set of labels rather than a wall of illustration.
 */
function ServiceTileBase({
  service,
  onPress,
}: {
  service: ServiceTileItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={service.label}
      onPress={onPress}
      android_ripple={{ color: 'rgba(20,23,27,0.06)' }}
      style={styles.root}
    >
      <View style={styles.pad}>
        <Image
          source={service.image}
          contentFit="contain"
          style={styles.art}
          // Tiles are decorative next to their label, and there are eight of
          // them: skip the fade so the grid lands in one paint.
          transition={0}
        />
      </View>
      <AppText weight="medium" numberOfLines={1} style={styles.label}>
        {service.label}
      </AppText>
    </Pressable>
  );
}

export const ServiceTile = memo(ServiceTileBase);

const styles = StyleSheet.create({
  root: {
    width: '25%',
    alignItems: 'center',
    gap: 9,
  },
  pad: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  art: {
    width: 44,
    height: 44,
  },
  label: {
    fontSize: 11.5,
    letterSpacing: -0.115,
    color: colors.inkMuted,
  },
});
