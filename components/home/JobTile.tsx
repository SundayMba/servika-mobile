import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/**
 * A job tile on Home: a white card with the trade's artwork on a soft wash of its own tint,
 * and a two-line label so "Plumbing & Borehole" is never cut. Three to a row.
 */
function JobTileBase({
  label,
  image,
  tint,
  icon,
  width,
  onPress,
}: {
  label: string;
  image?: ImageSourcePropType;
  /** Category tint ("#3B82F6"); the art sits on a 12% wash of it. */
  tint?: string;
  /** Used instead of artwork (the "More" tile). */
  icon?: keyof typeof Ionicons.glyphMap;
  width: number;
  onPress?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={[styles.wash, { backgroundColor: tint ? `${tint}1F` : colors.sand }]}>
        {icon ? (
          <Ionicons name={icon} size={26} color={colors.ink} />
        ) : (
          <Image source={image} contentFit="contain" style={styles.art} transition={0} />
        )}
      </View>
      <AppText weight="semibold" numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

export const JobTile = memo(JobTileBase);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pressed: { transform: [{ scale: 0.97 }], backgroundColor: '#FBFAF8' },
  wash: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  art: { width: 46, height: 46 },
  // Stretched so the measured box matches what paints (Android clips shrink-wrapped Text).
  label: { alignSelf: 'stretch', minHeight: 34, fontSize: 12.5, lineHeight: 16, letterSpacing: -0.12, textAlign: 'center', color: colors.ink },
});
