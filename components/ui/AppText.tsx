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
      style={[WEIGHTS[weight], style]}
      {...rest}
    >
      {/* A trailing NO-BREAK SPACE (U+00A0), and it has to be that one.
          Android trims a plain U+0020 at end of line, so it reserves no width
          and the final glyph still gets clipped; U+2009 is absent from
          Instrument Sans, so it opened a fallback run and Android dropped every
          word after the preceding space. U+00A0 is in the font and is not
          trimmed, so the last glyph keeps its advance. */}
      {typeof children === 'string' ? children + ' ' : children}
    </Text>
  );
}
