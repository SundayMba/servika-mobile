import { colors } from '@/constants/colors';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const LOGO = require('@assets/images/general-sizes/servika-orange-clean-logo-transparent-512x512.png');

const LOGO_SIZE = 120;

interface Props {
  /** Optional: fired once the in-app splash paints, for a seamless native-splash handoff. */
  onReady?: () => void;
  onFinish: () => void;
}

// NOTE: This screen is driven by the Animated API (opacity timelines), so its
// styles live in StyleSheet rather than Tailwind — animated values must be fed
// through the `style` prop, which Tailwind className cannot express.
export function SplashScreen({ onReady, onFinish }: Props) {
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      onReady?.();

      Animated.sequence([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => onFinish());
    }, 0);

    return () => clearTimeout(t);
  }, [contentOpacity, screenOpacity, onReady, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Animated.View
        style={[styles.centerContent, { opacity: contentOpacity }]}
      >
        <Animated.Image
          source={LOGO}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>Servika</Text>
        <Text style={styles.tagline}>Trusted repairs near you</Text>
      </Animated.View>

      <Animated.View
        style={[styles.dotsContainer, { opacity: contentOpacity }]}
      >
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
    letterSpacing: 0.1,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
});
