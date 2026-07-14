import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';

const LOGO = require('@assets/images/general-sizes/servika-orange-clean-logo-transparent-512x512.png');

// Must match the native splash (app.json expo-splash-screen imageWidth) so the
// native → JS handoff is invisible: the logo simply stays put and the brand
// text appears beneath it. One perceived screen, no flash.
const LOGO_SIZE = 80;

interface Props {
  /** Fired on the first painted frame — the moment it's safe to hide the
   * native splash without a blank flash in between. */
  onReady?: () => void;
  onFinish: () => void;
}

// Animated-API opacities can't be expressed with Tailwind classNames, so this
// screen uses StyleSheet.
export function SplashScreen({ onReady, onFinish }: Props) {
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Two frames in, this component has definitely painted over the native
    // splash — the swap is seamless because the logo is identical and unmoved.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => onReady?.()),
    );

    Animated.sequence([
      // Only the text animates — the logo is at full opacity from frame one.
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(450),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());

    return () => cancelAnimationFrame(raf);
  }, [textOpacity, screenOpacity, onReady, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.Image source={LOGO} style={styles.logo} resizeMode="contain" />
      <Animated.View style={[styles.textBlock, { opacity: textOpacity }]}>
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  // Dead-centre of the screen — exactly where the native splash draws it.
  logo: {
    position: 'absolute',
    top: SCREEN_H / 2 - LOGO_SIZE / 2,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  textBlock: {
    position: 'absolute',
    top: SCREEN_H / 2 + LOGO_SIZE / 2 + 18,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
});
