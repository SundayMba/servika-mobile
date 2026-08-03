import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, Text, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/** One image in the viewer. `headers` carries the Bearer token for the
 *  auth-gated booking-media endpoint. */
export type ViewerPhoto = { uri: string; headers?: Record<string, string> };

/**
 * Fullscreen photo viewer: swipe between photos, pinch (or double-tap) to
 * zoom, drag to pan while zoomed. Built on gesture-handler + reanimated —
 * both already in the app, so no new native dependency / rebuild.
 *
 * Paging is locked while an image is zoomed (the pan drags the image instead),
 * and un-zooming re-enables the swipe — so the two gestures never fight.
 */
export function PhotoViewer({
  photos,
  initialIndex = 0,
  visible,
  onClose,
}: {
  photos: ViewerPhoto[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}) {
  const { width, height } = Dimensions.get('window');
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  // Re-open at the tapped photo (the Modal stays mounted between opens).
  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setZoomed(false);
    }
  }, [visible, initialIndex]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Gestures inside a Modal need their own root view on Android. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black">
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            scrollEnabled={!zoomed}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.min(initialIndex, photos.length - 1)}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(p) => p.uri}
            onMomentumScrollEnd={(e) =>
              setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <ZoomablePhoto
                photo={item}
                width={width}
                height={height}
                onZoomChange={setZoomed}
              />
            )}
          />

          {/* Close + position counter */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close photo viewer"
            onPress={onClose}
            hitSlop={10}
            className="absolute left-4 top-14 h-10 w-10 items-center justify-center rounded-full bg-white/15"
          >
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          {photos.length > 1 ? (
            <View className="absolute top-16 self-center rounded-full bg-white/15 px-3 py-1">
              <Text className="text-[13px] font-semibold text-white">
                {index + 1} / {photos.length}
              </Text>
            </View>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

function ZoomablePhoto({
  photo,
  width,
  height,
  onZoomChange,
}: {
  photo: ViewerPhoto;
  width: number;
  height: number;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  const setZoomed = useCallback(
    (z: boolean) => onZoomChange(z),
    [onZoomChange],
  );

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.02) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedTx.value = 0;
        savedTy.value = 0;
        runOnJS(setZoomed)(false);
      } else {
        runOnJS(setZoomed)(true);
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value <= 1) return;
      // Keep the image within reach: the pan can't drag it fully off-screen.
      const maxX = (width * (scale.value - 1)) / 2;
      const maxY = (height * (scale.value - 1)) / 2;
      tx.value = Math.min(maxX, Math.max(-maxX, savedTx.value + e.translationX));
      ty.value = Math.min(maxY, Math.max(-maxY, savedTy.value + e.translationY));
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedTx.value = 0;
        savedTy.value = 0;
        runOnJS(setZoomed)(false);
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
        runOnJS(setZoomed)(true);
      }
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[{ width, height, justifyContent: 'center' }, style]}
        collapsable={false}
      >
        <Image
          source={photo.headers ? { uri: photo.uri, headers: photo.headers } : { uri: photo.uri }}
          style={{ width, height }}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}
