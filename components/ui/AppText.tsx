import { Text, type TextProps, type TextStyle } from 'react-native';

import { fonts } from '@/constants/colors';

/**
 * Text in the app's typeface.
 *
 * React Native has no font inheritance: a Text without an explicit fontFamily
 * silently falls back to the system face, which is invisible in review and
 * obvious on device. Setting it in one place is the whole job.
 *
 * It is deliberately NOT the place to work around Android's glyph clipping.
 * Appending a hair space to every label looked like a tidy central fix and was
 * actively harmful: Instrument Sans has no U+2009, so the appended character
 * opened a font-fallback run and Android dropped the text after the preceding
 * space — "24/7 Available" rendered as "24/7", "Get help now" as "Get help".
 * The clipping it was chasing comes from negative letterSpacing, so the fix is
 * simply not to track small labels tightly; display type keeps its tracking and
 * has room to spare.
 */

type Weight = 'regular' | 'medium' | 'semibold';

const WEIGHTS: Record<Weight, TextStyle> = {
  regular: { fontFamily: fonts.regular },
  medium: { fontFamily: fonts.medium },
  semibold: { fontFamily: fonts.semibold },
};

export interface AppTextProps extends TextProps {
  weight?: Weight;
}

export function AppText({
  weight = 'regular',
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      // The layout is drawn at 390pt and phones are commonly 360; letting the
      // device's text-size setting compound on top of that clips tight rows.
      // A modest cap keeps the setting respected without breaking the grid —
      // pass your own value for body copy that can afford to grow.
      maxFontSizeMultiplier={1.1}
      style={[WEIGHTS[weight], style]}
      {...rest}
    >
      {/* Instrument Sans reports a narrower advance to Android than it paints,
          so the final glyph is clipped inside the text layout — "Get help no|w",
          "Popular Service|s". Neither padding nor tracking reaches it. A single
          trailing U+0020 does, and unlike the U+2009 this replaced, the space
          glyph IS in the font, so no fallback run opens and no text is dropped. */}
      {typeof children === 'string' ? children + ' ' : children}
    </Text>
  );
}
