import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';

// OPay-style static splash. The NATIVE splash (app.json) is this same white
// logo tile, 96pt, dead-centre on brand orange. This screen draws the tile at
// exactly that spot and adds the wordmark and tagline beneath it, so when JS
// comes up nothing moves: the text simply appears under a logo that was
// already there. Then it holds briefly and fades into the app.
const LOGO = require('@assets/images/logo/splash-tile.webp');
const LOGO_SIZE = 96;
const HOLD_MS = 900;
const FADE_MS = 220;

interface Props {
  /** Fired on the first painted frame — safe to hide the native splash. */
  onReady?: () => void;
  onFinish: () => void;
}

export function SplashScreen({ onReady, onFinish }: Props) {
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // Two frames in, this component has definitely painted over the native splash.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => onReady?.()),
    );

    screenOpacity.value = withDelay(
      HOLD_MS,
      withTiming(
        0,
        { duration: FADE_MS, easing: Easing.in(Easing.quad) },
        (done) => {
          if (done) runOnJS(onFinish)();
        },
      ),
    );

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      <View style={styles.textBlock}>
        <Text style={styles.brandName}>Servika</Text>
        <Text style={styles.tagline}>Verified artisans. Trusted service.</Text>
      </View>
      <Text style={styles.footer}>Payments held securely until the job is done</Text>
    </Animated.View>
  );
}

// The OS centres its icon on the full screen (status bar included), so measure
// the same way — `window` excludes the status bar on Android and would sit the
// tile a few points high.
const { height: SCREEN_H } = Dimensions.get('screen');

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // Overlays the booting app — must beat any elevated sibling on Android.
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  // Dead-centre — exactly where the native splash draws the tile.
  logo: {
    position: 'absolute',
    top: SCREEN_H / 2 - LOGO_SIZE / 2,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  textBlock: {
    position: 'absolute',
    top: SCREEN_H / 2 + LOGO_SIZE / 2 + 26,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  footer: {
    position: 'absolute',
    bottom: 56,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.75)',
  },
});
