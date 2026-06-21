import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { SearchSheet } from '@/components/SearchSheet';
import { colors } from '@/constants/colors';
import {
  categoryIcon,
  categoryImage,
} from '@/lib/catalogue/assets';
import { useCategories } from '@/lib/catalogue/hooks';
import type { Category } from '@/lib/catalogue/types';

// Height of the custom bottom tab bar (excluding the safe-area inset).
const TAB_BAR_HEIGHT = 60;

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
      <Text
        numberOfLines={2}
        className="mt-2 px-1 text-center text-[12px] font-medium text-gray-700"
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

export default function Categories() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

  const [searchVisible, setSearchVisible] = useState(false);

  const { data: categories, isLoading, isError } = useCategories();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Text className="text-[26px] font-bold text-gray-900">Categories</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search"
            onPress={() => setSearchVisible(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textPrimary}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter"
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="options-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
      >
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isError ? (
          <View className="items-center justify-center px-6 py-16">
            <Text className="text-center text-[14px] text-gray-400">
              Couldn&apos;t load categories. Check your connection and try again.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between px-5 pt-1">
            {categories?.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() =>
                  router.push({
                    pathname: '/category/[id]',
                    params: { id: category.slug },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Search (open to guests) */}
      <SearchSheet
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </SafeAreaView>
  );
}
