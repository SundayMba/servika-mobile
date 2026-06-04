import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OnboardingSlide } from '../../components/onboarding/OnboardingSlide';
import { colors } from '../../constants/colors';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('@assets/images/onboarding/find-artisans.png'),
    imageAspect: 781 / 850,
    title: 'Find trusted\nartisans nearby',
    subtitle:
      'Discover electricians, plumbers, fridge repairers and more around your location.',
  },
  {
    id: '2',
    image: require('@assets/images/onboarding/explore-services.png'),
    imageAspect: 755 / 865,
    title: 'Explore services\nbefore you sign up',
    subtitle:
      'Browse repair categories and see how Servika can help before creating an account.',
  },
  {
    id: '3',
    image: require('@assets/images/onboarding/secure-booking.png'),
    imageAspect: 941 / 870,
    title: "Book only when\nyou're ready",
    subtitle:
      'Browse as a guest, then sign up when you want to view artisan details or make a booking.',
  },
];

export default function Welcome() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideAreaHeight, setSlideAreaHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.replace('/home');
    }
  }, [currentIndex, router]);

  const handleSkip = useCallback(() => {
    router.replace('/home');
  }, [router]);

  const onSlideAreaLayout = useCallback((e: LayoutChangeEvent) => {
    setSlideAreaHeight(e.nativeEvent.layout.height);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / W));
    },
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View className="h-14 flex-row items-center justify-between px-6">
        <View className="flex-row items-center gap-2">
          <Image
            source={require('@assets/images/logo/app-icon.png')}
            className="h-[30px] w-[30px]"
            resizeMode="contain"
          />
          <Text className="text-lg font-bold text-gray-900">Servika</Text>
        </View>
        <TouchableOpacity
          onPress={handleSkip}
          hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
        >
          <Text className="text-[15px] font-medium text-gray-400">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ── Slide area ── */}
      <View className="flex-1" onLayout={onSlideAreaLayout}>
        {slideAreaHeight > 0 && (
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumScrollEnd}
            keyExtractor={(item) => item.id}
            getItemLayout={(_, index) => ({
              length: W,
              offset: W * index,
              index,
            })}
            renderItem={({ item }) => (
              <OnboardingSlide
                image={item.image}
                imageAspect={item.imageAspect}
                title={item.title}
                subtitle={item.subtitle}
                slideWidth={W}
                slideHeight={slideAreaHeight}
              />
            )}
          />
        )}
      </View>

      {/* ── Bottom ── */}
      <View className="items-center gap-5 px-6 pb-3 pt-2">
        {/* Pagination dots */}
        <View className="flex-row items-center gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={
                i === currentIndex
                  ? 'h-2 w-[22px] rounded-full bg-primary'
                  : 'h-2 w-2 rounded-full bg-gray-200'
              }
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          className="h-14 w-full items-center justify-center rounded-[14px] bg-primary"
          style={{
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 6,
          }}
          onPress={handleNext}
          activeOpacity={0.82}
        >
          <Text className="text-[17px] font-bold text-white">
            {currentIndex === SLIDES.length - 1 ? 'Start Exploring' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
