import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/** A field's own error, sliding in right under it. Renders nothing without text. */
export function FieldError({ text, style }: { text?: string | null; style?: StyleProp<TextStyle> }) {
  if (!text) return null;
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <AppText style={[styles.error, style]}>{text}</AppText>
    </Animated.View>
  );
}

/** True while any field in the map has an error. */
export function hasFieldErrors(errs: Record<string, string | undefined | null>) {
  return Object.values(errs).some(Boolean);
}

const styles = StyleSheet.create({
  error: { marginTop: 8, fontSize: 13, lineHeight: 18, color: colors.dangerOnInk },
});
