import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/** Space between the card edge and the artwork wash. */
const INSET = 6;

/**
 * A job tile on Home: a white card whose artwork fills its width (a soft wash of the trade's
 * tint behind it, small padding all round) and a two-line label so "Plumbing & Borehole" is
 * never cut. Three to a row.
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
  /** Used instead of artwork (the "Something else" tile). */
  icon?: keyof typeof Ionicons.glyphMap;
  width: number;
  onPress?: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const wash = width - INSET * 2 - 2; // minus the 1px border each side
  const art = Math.round(wash * 0.86);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.card, { width }, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.wash,
          { width: wash, height: wash, backgroundColor: tint ? `${tint}1F` : colors.sand },
        ]}
      >
        {icon ? (
          <Ionicons name={icon} size={Math.round(wash * 0.36)} color={colors.ink} />
        ) : (
          <Image source={image} contentFit="contain" style={{ width: art, height: art }} transition={0} />
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
    gap: 8,
    paddingTop: INSET,
    paddingBottom: 10,
    paddingHorizontal: INSET,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pressed: { transform: [{ scale: 0.97 }], backgroundColor: '#FBFAF8' },
  wash: { borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  // Stretched so the measured box matches what paints (Android clips shrink-wrapped Text).
  label: { alignSelf: 'stretch', minHeight: 32, fontSize: 12.5, lineHeight: 16, letterSpacing: -0.12, textAlign: 'center', color: colors.ink },
});
