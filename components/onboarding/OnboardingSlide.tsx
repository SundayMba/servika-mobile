import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, fonts } from '@/constants/colors';

/**
 * One onboarding slide, per the "Servika Onboarding" design canvas.
 *
 * The artwork is full-bleed behind the header and dissolves into the sand
 * ground. The design does that with a radial CSS mask plus a long vertical
 * scrim; the radial half is baked into the asset by tools/build-onboarding-art.mjs
 * (see that file for why), so all this has to draw is the picture and one
 * gradient. Copy is bottom-anchored, which keeps every headline on the same
 * baseline regardless of how tall the illustration is.
 */

/** Design frame: the illustration box is 390x470 inside a 390-wide screen. */
const IMAGE_RATIO = 470 / 390;
/** Where the scrim starts and ends, as a fraction of the image height. */
const SCRIM_START = 0.404;
const SCRIM_HEIGHT = 0.791;
/**
 * The comp is 390pt wide. Real phones are narrower — this one is 360pt — and the
 * headline is set tight enough that 8% is the difference between fitting and
 * clipping mid-word, so display type scales with the viewport rather than being
 * fixed. Capped at 1 so it never grows past the drawn size on a tablet.
 */
const DESIGN_WIDTH = 390;

const SAND = colors.sand;
const SCRIM_COLORS = [
  'rgba(244,243,240,0)',
  'rgba(244,243,240,0.18)',
  'rgba(244,243,240,0.48)',
  'rgba(244,243,240,0.82)',
  SAND,
] as const;
const SCRIM_LOCATIONS = [0, 0.22, 0.44, 0.66, 0.86] as const;
const WASH_COLORS = ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'] as const;

interface Props {
  image: ImageSourcePropType;
  /** First line, in ink. */
  title: string;
  /** Second line, in the deep orange. */
  titleAccent: string;
  subtitle: string;
  slideWidth: number;
  slideHeight: number;
  /** Status-bar inset — the art starts just below it, as in the design. */
  topInset: number;
  /** Only the first slide plays the entrance; the rest arrive by swiping. */
  animate: boolean;
}

function OnboardingSlideBase({
  image,
  title,
  titleAccent,
  subtitle,
  slideWidth,
  slideHeight,
  topInset,
  animate,
}: Props) {
  const imageHeight = slideWidth * IMAGE_RATIO;
  const scale = Math.min(slideWidth / DESIGN_WIDTH, 1);
  const titleStyle = {
    fontSize: Math.round(33 * scale),
    lineHeight: Math.round(35 * scale),
    letterSpacing: -1.32 * scale,
  };

  return (
    <View style={{ width: slideWidth, height: slideHeight, backgroundColor: SAND }}>
      <Image
        source={image}
        style={{
          position: 'absolute',
          top: topInset,
          left: 0,
          width: slideWidth,
          height: imageHeight,
        }}
        resizeMode="contain"
        // The art is decorative; the headline beside it carries the meaning.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />

      <LinearGradient
        colors={SCRIM_COLORS}
        locations={SCRIM_LOCATIONS}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: topInset + imageHeight * SCRIM_START,
          height: imageHeight * SCRIM_HEIGHT,
        }}
      />

      <LinearGradient
        colors={WASH_COLORS}
        pointerEvents="none"
        style={styles.topWash}
      />

      <View style={styles.body}>
        <Animated.View
          entering={animate ? FadeInDown.delay(250).duration(900) : undefined}
          style={styles.copy}
        >
          <Text
            style={[styles.title, titleStyle]}
            // The device's text-size setting is respected everywhere else, but
            // this is display type at 33pt with -.04em tracking: let it grow and
            // it runs off the edge mid-word.
            maxFontSizeMultiplier={1}
          >
            {title}
            {'\n'}
            <Text style={styles.titleAccent}>{titleAccent}</Text>
          </Text>
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
            {subtitle}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * The pager re-renders on every page change; the slides themselves never change,
 * so memoising keeps that to the one thing that actually moved.
 */
export const OnboardingSlide = memo(OnboardingSlideBase);

const styles = StyleSheet.create({
  topWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 26,
  },
  copy: {
    gap: 12,
  },
  title: {
    fontFamily: fonts.semibold,
    color: colors.ink,
    // Android measures a negatively-tracked run one advance short and clips the
    // final glyph ("already vouched for|."); give it that step back.
    paddingRight: 2,
  },
  titleAccent: {
    color: colors.accentDeep,
  },
  subtitle: {
    maxWidth: 300,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
});
