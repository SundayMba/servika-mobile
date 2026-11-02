import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { InterestSheet } from '@/components/home/InterestSheet';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { colors } from '@/constants/colors';
import { categoryIcon, categoryImage } from '@/lib/catalogue/assets';
import { useCategories } from '@/lib/catalogue/hooks';
import type { Category } from '@/lib/catalogue/types';

// All service categories. A plain stack screen (no bottom tab bar) — reached
// from Home's "View all" and the SOS card; the tab bar's center slot now
// belongs to the Explore map.

function CategoryCard({
  category,
  onPress,
}: {
  category: Category;
  onPress?: () => void;
}) {
  const image = categoryImage(category.slug);
  const icon = categoryIcon(category.iconKey);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name}
      onPress={onPress}
      className="mb-1 w-[33%] items-center border border-gray-100/70 bg-white py-3 active:opacity-80"
    >
      <View
        style={{ backgroundColor: `${category.tint}14` }}
        className="h-20 w-20 items-center justify-center rounded-2xl"
      >
        {image ? (
          <Image
            source={image}
            contentFit="contain"
            style={{ height: 70, width: 70 }}
          />
        ) : icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={32}
            color={category.tint}
          />
        ) : null}
      </View>
      <AppText
        weight="medium"
        numberOfLines={2}
        className="mt-2 px-1 text-center text-[12px] text-gray-700"
      >
        {category.name}
      </AppText>
    </Pressable>
  );
}

export default function Categories() {
  const router = useRouter();

  const [interest, setInterest] = useState<{ slug: string; name: string } | null>(null);
  const { guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();

  const { data: categories, isLoading, isError } = useCategories();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <AppText weight="semibold" className="text-[26px] text-gray-900">Every service</AppText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <View className="items-center justify-center px-6 py-16">
            <AppText className="text-center text-[14px] text-gray-400">
              Couldn&apos;t load categories. Check your connection and try again.
            </AppText>
          </View>
        ) : (
          <>
            <AppText weight="semibold" className="px-5 pb-3 text-[15px] text-gray-900">Book now</AppText>
            <View className="flex-row flex-wrap justify-between px-5 pt-1">
              {categories?.filter((c) => c.isPopular).map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onPress={() =>
                    guard(() =>
                      router.push({ pathname: '/booking/request', params: { categorySlug: category.slug, open: '1', service: category.name } }),
                    )
                  }
                />
              ))}
            </View>
            <AppText weight="semibold" className="px-5 pb-1 pt-6 text-[15px] text-gray-900">Coming soon</AppText>
            <AppText className="px-5 pb-3 text-[13px] text-gray-500">Not offered yet. Tap one to tell us you need it.</AppText>
            <View className="flex-row flex-wrap justify-between px-5 pt-1" style={{ opacity: 0.75 }}>
              {categories?.filter((c) => !c.isPopular).map((category) => (
                <CategoryCard key={category.id} category={category} onPress={() => setInterest({ slug: category.slug, name: category.name })} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <InterestSheet visible={!!interest} onClose={() => setInterest(null)} category={interest} />
      <AuthPromptSheet visible={promptVisible} onClose={hidePrompt} onSignedIn={onSignedIn} reason="book" />
    </SafeAreaView>
  );
}
