import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  image: ImageSourcePropType;
  /** intrinsic aspect ratio of the cropped illustration (width / height) */
  imageAspect: number;
  title: string;
  subtitle: string;
  slideWidth: number;
  slideHeight: number;
}

export function OnboardingSlide({
  image,
  imageAspect,
  title,
  subtitle,
  slideWidth,
  slideHeight,
}: Props) {
  // Render the illustration full-bleed: it spans the full screen width, and the
  // band is sized to the image's natural height so nothing letterboxes on the
  // sides. Clamp the height so the text/CTA always have room.
  const naturalHeight = slideWidth / imageAspect;
  const bandHeight = Math.min(naturalHeight, slideHeight * 0.62);

  return (
    <View className="bg-white" style={{ width: slideWidth, height: slideHeight }}>
      {/* ── Illustration band (full-bleed) ── */}
      <View
        className="w-full items-center justify-center overflow-hidden bg-white"
        style={{ height: bandHeight }}
      >
        <Image
          source={image}
          style={{ width: slideWidth, height: bandHeight }}
          resizeMode="cover"
        />

        {/* White fade at the very top — blends the illustration under the header */}
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255,255,255,0)']}
          style={styles.fadeTop}
          pointerEvents="none"
        />

        {/* White fade at the bottom — blends the illustration into the content */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#FFFFFF']}
          style={styles.fadeBottom}
          pointerEvents="none"
        />
      </View>

      {/* ── Text content ── */}
      <View className="flex-1 items-center px-7 pt-4">
        <Text className="mb-3.5 text-center text-[28px] font-extrabold leading-[37px] text-gray-900">
          {title}
        </Text>
        <Text className="max-w-[300px] text-center text-[15px] leading-[23px] text-gray-500">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

// Gradient overlays use the `style` prop because LinearGradient color stops and
// absolute positioning are clearer here than via className.
const styles = StyleSheet.create({
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
  },
});
