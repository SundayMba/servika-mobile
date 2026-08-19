import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { colors, fonts } from '@/constants/colors';

/**
 * Onboarding, per the "Servika Onboarding" design canvas.
 *
 * The header and the dots + CTA row are pinned over the pager rather than
 * living inside each slide: the artwork runs full-bleed up behind the header,
 * and the controls must not slide away with the page. The footer sits below the
 * pager in normal flow, so each slide's copy bottom-anchors just above it.
 */

const SLIDES = [
  {
    id: '1',
    image: require('@assets/images/onboarding/v2/find-artisans.webp'),
    title: 'Every artisan,',
    titleAccent: 'already vouched for.',
    subtitle:
      'Electricians, plumbers and fridge repairers near you — each one ID-checked before they can take a job.',
  },
  {
    id: '2',
    image: require('@assets/images/onboarding/v2/explore-services.webp'),
    title: 'Look around',
    titleAccent: 'before you sign up.',
    subtitle:
      'Browse every category and see real prices as a guest. No account until you actually want one.',
  },
  {
    id: '3',
    image: require('@assets/images/onboarding/v2/secure-booking.webp'),
    title: 'Your money waits',
    titleAccent: "until it's fixed.",
    subtitle:
      'Pay when you book, but the artisan is only paid once you confirm the job is done.',
  },
] as const;

export default function Welcome() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pagerHeight, setPagerHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace('/home');
    }
  }, [currentIndex, router]);

  const handleSkip = useCallback(() => {
    router.replace('/home');
  }, [router]);

  const onPagerLayout = useCallback((e: LayoutChangeEvent) => {
    setPagerHeight(e.nativeEvent.layout.height);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View style={styles.pager} onLayout={onPagerLayout}>
        {pagerHeight > 0 ? (
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            // Three fixed slides: render the first, keep the rest warm, and
            // never unmount them — recycling three screens costs more than
            // holding them.
            initialNumToRender={1}
            windowSize={3}
            removeClippedSubviews={false}
            renderItem={({ item, index }) => (
              <OnboardingSlide
                image={item.image}
                title={item.title}
                titleAccent={item.titleAccent}
                subtitle={item.subtitle}
                slideWidth={width}
                slideHeight={pagerHeight}
                topInset={insets.top}
                animate={index === 0}
              />
            )}
          />
        ) : null}
      </View>

      {/* Header — over the artwork, which runs up behind it. */}
      <View style={[styles.header, { top: insets.top }]} pointerEvents="box-none">
        <View style={styles.brand}>
          <Image
            source={require('@assets/images/logo/app-icon.webp')}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Trailing thin space: Android lays Instrument Sans out a shade
              narrower than it paints and clips the final glyph ("Servik|a").
              Padding cannot fix it — the clip is inside the text layout, not the
              view — so the run is given one more character to end on. */}
          <Text style={styles.brandName} maxFontSizeMultiplier={1.15}>
            {'Servika '}
          </Text>
        </View>
        <Pressable
          onPress={handleSkip}
          hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skip} maxFontSizeMultiplier={1.15}>
            {'Skip '}
          </Text>
        </Pressable>
      </View>

      {/* Progress + CTA share one line, as in the design. In normal flow, not
          absolutely positioned: `flex: 1` on the CTA needs a parent with a
          resolved width, and an absolute row gave it none — the button painted
          its label with a zero-width background. */}
      {/* The comp's 32pt bottom padding IS its safe-area allowance, so this is
          a floor, not an addition — insets.bottom + 32 double-counts it and
          pushes the row up off the bottom of the screen. */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotIdle]}
            />
          ))}
        </View>
        <Pressable
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Start exploring' : 'Next slide'}
          android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
          style={styles.cta}
        >
          {/* Spaced both sides so the same fix keeps the label centred. */}
          <Text style={styles.ctaLabel} maxFontSizeMultiplier={1.15}>
            {isLast ? ' Start exploring ' : ' Next '}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  pager: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 26,
    height: 26,
  },
  brandName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
    // No negative tracking here. Android lays a negatively-tracked run out one
    // advance short and clips the final glyph ("Servik|a") — padding does not
    // help, because the clip happens at text-layout level, not view level. At
    // 16pt the design's -.03em is imperceptible, so the tracking goes rather
    // than the last letter. The 33pt headline keeps its tracking, where it reads.
    flexShrink: 0,
  },
  skip: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.inkSubtle,
  },
  footer: {
    paddingHorizontal: 26,
    paddingTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 3,
    borderRadius: 99,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.ink,
  },
  dotIdle: {
    width: 10,
    backgroundColor: 'rgba(20,23,27,0.16)',
  },
  cta: {
    // flexGrow + an explicit basis rather than `flex: 1`, and marginLeft rather
    // than the row's `gap`: the shorthand plus gap left this with no resolved
    // width on Android, so it painted its label over a zero-size background.
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    marginLeft: 16,
    minHeight: 54,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentDeep,
  },
  ctaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.white,
  },
});
