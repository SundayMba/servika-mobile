import { type ReactNode, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Smooth, crisp glide with no bounce. Opens with a decelerating ease (pulls
// out then settles softly) and closes with an accelerating ease.
const ENTER_MS = 330;
const EXIT_MS = 320;
const ENTER_EASING = Easing.out(Easing.cubic);
const EXIT_EASING = Easing.in(Easing.cubic);

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra classes for the sheet surface (e.g. a fixed `h-[80%]`). */
  className?: string;
  /** Show the grab handle at the top. Defaults to true. */
  showHandle?: boolean;
  /**
   * Approximate sheet height used for the initial slide offset before the real
   * height is measured — keeps the entrance animation smooth.
   */
  estimatedHeight?: number;
  /** Fired once the entrance animation settles (e.g. to focus an input). */
  onOpened?: () => void;
};

/**
 * Animated bottom sheet built on a transparent Modal + Reanimated. Slides up
 * with a fading backdrop and stays mounted through its exit animation. Tapping
 * the backdrop dismisses it.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  className,
  showHandle = true,
  estimatedHeight = 420,
  onOpened,
}: BottomSheetProps) {
  // Keep the Modal mounted through the exit animation, then unmount.
  const [mounted, setMounted] = useState(visible);
  const insets = useSafeAreaInsets();

  const progress = useSharedValue(0);
  // Slide distance; seeded with an estimate and locked to the measured height
  // before the entrance animation runs (so a re-measure can't jolt it).
  const sheetHeight = useSharedValue(estimatedHeight);
  // Hidden until measured + positioned, to avoid a first-frame flash.
  const ready = useSharedValue(0);
  // Whether the current open cycle has measured + started animating.
  const openedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setMounted(true); // entrance kicks off in onLayout, once measured
    } else if (mounted) {
      openedRef.current = false;
      progress.value = withTiming(
        0,
        { duration: EXIT_MS, easing: EXIT_EASING },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Measure once per open cycle, then animate up from the correct offset.
  const handleLayout = (height: number) => {
    if (openedRef.current || !visible) return;
    openedRef.current = true;
    sheetHeight.value = height;
    progress.value = 0;
    ready.value = 1;
    progress.value = withTiming(
      1,
      { duration: ENTER_MS, easing: ENTER_EASING },
      (finished) => {
        if (finished && onOpened) runOnJS(onOpened)();
      },
    );
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.5,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: ready.value,
    transform: [{ translateY: (1 - progress.value) * sheetHeight.value }],
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Animated.View
          style={[{ backgroundColor: '#0F172A' }, backdropStyle]}
          className="absolute inset-0"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={onClose}
            className="flex-1"
          />
        </Animated.View>

        {/* Sheet — rises above the keyboard when an input inside is focused. */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View
            onLayout={(e) => handleLayout(e.nativeEvent.layout.height)}
            style={[
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
              sheetStyle,
            ]}
            className={`rounded-t-3xl bg-white px-6 pt-3 ${className ?? ''}`}
          >
            {showHandle ? (
              <View className="mb-5 items-center">
                <View className="h-1.5 w-11 rounded-full bg-gray-200" />
              </View>
            ) : null}
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
