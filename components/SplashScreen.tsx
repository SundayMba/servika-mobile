import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';

// The native splash is a blank ORANGE screen (transparent image in app.json),
// so this animated splash is the only branding anyone sees. The orange logo
// wouldn't read on orange, so it lives in a white rounded tile — the same
// treatment as the Pro app, in the customer brand color.
const LOGO = require('@assets/images/logo/splash-tile.png');
const LOGO_SIZE = 96;
const RING_SIZE = 190;

interface Props {
  /** Fired on the first painted frame — safe to hide the native splash. */
  onReady?: () => void;
  onFinish: () => void;
}

/**
 * Animated brand splash (Cowrywise-style): the logo takes over from the static
 * native splash, pops with a spring, a soft halo ring ripples out, the brand
 * text slides up — then the whole screen scales and fades into the app.
 */
export function SplashScreen({ onReady, onFinish }: Props) {
  const logoScale = useSharedValue(0.55);
  const logoOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textShift = useSharedValue(16);
  const screenOpacity = useSharedValue(1);
  const screenScale = useSharedValue(1);

  useEffect(() => {
    // Two frames in, this component has definitely painted over the native splash.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => onReady?.()),
    );

    // The native splash is a blank brand-colored screen, so the logo
    // animates IN: fade + overshoot pop, like the app coming alive.
    logoOpacity.value = withDelay(0, withTiming(1, { duration: 200 }));
    logoScale.value = withDelay(
      0,
      withSequence(
        withTiming(1.12, { duration: 280, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 9, stiffness: 160 }),
      ),
    );

    // Halo ring ripples out behind the logo.
    ringOpacity.value = withDelay(
      140,
      withSequence(
        withTiming(0.5, { duration: 180 }),
        withTiming(0, { duration: 620, easing: Easing.out(Easing.quad) }),
      ),
    );
    ringScale.value = withDelay(
      140,
      withTiming(1.45, { duration: 800, easing: Easing.out(Easing.quad) }),
    );

    // Brand text slides up into place.
    textOpacity.value = withDelay(300, withTiming(1, { duration: 260 }));
    textShift.value = withDelay(
      300,
      withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );

    // Exit: the splash scales slightly and melts into the app.
    screenScale.value = withDelay(
      1500,
      withTiming(1.05, { duration: 240, easing: Easing.in(Easing.quad) }),
    );
    screenOpacity.value = withDelay(
      1500,
      withTiming(
        0,
        { duration: 240, easing: Easing.in(Easing.quad) },
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
    transform: [{ scale: screenScale.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textShift.value }],
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.Image
        source={LOGO}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.brandName}>Servika</Text>
        <Text style={styles.tagline}>Trusted repairs near you</Text>
      </Animated.View>
    </Animated.View>
  );
}

const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    // Overlays the booting app — must beat any elevated sibling on Android.
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  // Dead-centre — exactly where the native splash draws the logo.
  logo: {
    position: 'absolute',
    top: SCREEN_H / 2 - LOGO_SIZE / 2,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  ring: {
    position: 'absolute',
    top: SCREEN_H / 2 - RING_SIZE / 2,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    color: 'rgba(255,255,255,0.75)',
  },
});
