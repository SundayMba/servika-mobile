import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/**
 * A job tile on Home, in the original Popular Services style: the artwork on a white rounded
 * square with a hairline, and the name underneath. Labels may wrap to two lines so
 * "Plumbing & Borehole" is never cut.
 */
function JobTileBase({
  label,
  image,
  icon,
  width,
  onPress,
}: {
  label: string;
  image?: ImageSourcePropType;
  /** Used instead of artwork (the "Something else" tile). */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Column width; the square scales with it. */
  width: number;
  /** Kept for callers; the original tiles are plain white. */
  tint?: string;
  onPress?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const pad = Math.min(84, Math.round(width * 0.78));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.root, { width }]}
    >
      <View style={[styles.pad, { width: pad, height: pad, borderRadius: Math.round(pad * 0.3) }, pressed && styles.pressed]}>
        {icon ? (
          <Ionicons name={icon} size={Math.round(pad * 0.36)} color={colors.inkMuted} />
        ) : (
          <Image source={image} contentFit="contain" style={{ width: Math.round(pad * 0.66), height: Math.round(pad * 0.66) }} transition={0} />
        )}
      </View>
      <AppText weight="medium" numberOfLines={2} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

export const JobTile = memo(JobTileBase);

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 10 },
  pad: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pressed: { transform: [{ scale: 0.96 }], backgroundColor: '#FBFAF8' },
  // Stretched so the measured box matches what paints (Android clips shrink-wrapped Text).
  label: { alignSelf: 'stretch', fontSize: 13, lineHeight: 17, letterSpacing: -0.13, textAlign: 'center', color: colors.inkMuted },
});
