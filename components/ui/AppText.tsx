import { cssInterop } from 'nativewind';
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
  /**
   * This Text sits INSIDE another Text, as part of one run of prose.
   *
   * Suppresses the trailing space below. The clipping it guards against is a
   * property of a Text box's own last glyph, and a nested span has no box of
   * its own — the parent paragraph lays out the whole line. Left on, the space
   * lands mid-sentence: "Needs:  paint", "Terms  and  Privacy".
   */
  inline?: boolean;
  /** Resolved by NativeWind — see the cssInterop registration at the foot. */
  className?: string;
}

export function AppText({
  weight = 'regular',
  inline = false,
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
      {typeof children === 'string' && !inline ? children + ' ' : children}
    </Text>
  );
}

/**
 * Teach NativeWind to resolve `className` on AppText.
 *
 * The className transform only applies to components NativeWind knows about —
 * React Native's own, and anything registered here. Without this line every
 * `className` on an AppText is forwarded to Text as an unknown prop and
 * silently dropped, which looks exactly like the styles never existed.
 *
 * The resolved styles land in `style`, after the weight's fontFamily in the
 * array above, so a class can override colour and size but the typeface is
 * always the app's. Font-weight utilities are deliberately not used on
 * AppText: each Instrument Sans weight is its own family, so `font-bold` would
 * only ask Android to synthesise a fake bold over the regular face.
 */
cssInterop(AppText, { className: 'style' });
