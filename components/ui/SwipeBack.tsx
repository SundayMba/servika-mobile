import { useRouter } from 'expo-router';
import { type ReactNode, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

/**
 * Edge swipe to go back.
 *
 * iOS gives this for free and Android gives it via the system's predictive back
 * gesture — but only on devices using gesture navigation. On three-button
 * navigation (still common, and what this phone is set to) there is no back
 * gesture at all, and the native stack does not implement one. So a screen that
 * pushes on top of another has to provide it.
 *
 * Deliberately narrow, so it never fights the content:
 *  - it only starts within EDGE_WIDTH of the left edge, the way iOS does, which
 *    keeps horizontal carousels and sliders in the middle of the screen working;
 *  - it needs a decisive horizontal movement before it activates, and fails
 *    outright on vertical movement, so scrolling always wins.
 */

/** How far in from the left edge a swipe may start. */
const EDGE_WIDTH = 44;
/** Horizontal travel before the gesture takes over from the scroll view. */
const ACTIVATE_X = 18;
/** Vertical travel that hands the gesture back to the scroll view. */
const FAIL_Y = 16;
/** Distance that counts as a back swipe on its own. */
const DISTANCE = 90;
/** A shorter flick still counts if it was fast enough. */
const FLICK_VELOCITY = 700;
const FLICK_DISTANCE = 40;

export function SwipeBack({
  children,
  enabled = true,
}: {
  children: ReactNode;
  /** Turn off where a back swipe would be wrong (e.g. a root tab). */
  enabled?: boolean;
}) {
  const router = useRouter();

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, [router]);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX(ACTIVATE_X)
    .failOffsetY([-FAIL_Y, FAIL_Y])
    .onEnd((e) => {
      // absoluteX is where the finger ended; subtracting the travel gives where
      // it started, which is what decides whether this was an edge swipe.
      const startX = e.absoluteX - e.translationX;
      if (startX > EDGE_WIDTH) return;
      const far = e.translationX > DISTANCE;
      const flicked = e.translationX > FLICK_DISTANCE && e.velocityX > FLICK_VELOCITY;
      if (far || flicked) runOnJS(goBack)();
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
