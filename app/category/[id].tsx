import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchSheet } from '@/components/SearchSheet';
import { colors } from '@/constants/colors';
import { getCategoryById } from '@/constants/home-data';
import {
  getCategoryArtisanId,
  getCategoryServices,
  SERVICE_FILTERS,
  type ServiceListing,
} from '@/constants/services-data';

function ServiceRow({
  service,
  onPress,
}: {
  service: ServiceListing;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={service.title}
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl border border-gray-100/70 bg-white p-3 active:opacity-80"
    >
      <View className="h-20 w-20 overflow-hidden rounded-xl bg-background">
        {service.image ? (
          <Image source={service.image} contentFit="cover" style={{ flex: 1 }} />
        ) : null}
      </View>

      <View className="flex-1">
        <Text className="text-[15px] font-bold text-gray-900">
          {service.title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-[12px] text-gray-500">
          {service.description}
        </Text>
        <Text className="mt-1 text-[13px] font-semibold text-primary">
          From {service.priceFrom}
        </Text>
        <View className="mt-1 flex-row items-center gap-1">
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text className="text-[12px] font-semibold text-gray-700">
            {service.rating.toFixed(1)}
          </Text>
          <Text className="text-[12px] text-gray-400">({service.reviews})</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export default function CategoryListing() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [searchVisible, setSearchVisible] = useState(false);
  const [filter, setFilter] = useState<'All' | ServiceListing['type']>('All');

  const category = getCategoryById(id);
  const services = useMemo(
    () => (category ? getCategoryServices(category) : []),
    [category],
  );
  const visible = useMemo(
    () => (filter === 'All' ? services : services.filter((s) => s.type === filter)),
    [services, filter],
  );

  if (!category) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-[16px] font-semibold text-gray-900">
          Category not found
        </Text>
        <Pressable hitSlop={8} className="mt-3" onPress={() => router.back()}>
          <Text className="text-[14px] font-bold text-primary">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text className="text-[17px] font-bold text-gray-900">
          {category.label} Services
        </Text>
      </View>

      {/* Search */}
      <Pressable
        accessibilityRole="search"
        onPress={() => setSearchVisible(true)}
        className="mx-5 mb-3 mt-1 h-12 flex-row items-center gap-2.5 rounded-2xl border border-gray-100/70 bg-white px-4"
      >
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <Text className="flex-1 text-[14px] text-gray-400">
          Search {category.label.toLowerCase()} services...
        </Text>
        <Ionicons name="options-outline" size={18} color={colors.primary} />
      </Pressable>

      {/* Filter chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {SERVICE_FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(f.key)}
                className={
                  active
                    ? 'flex-row items-center gap-1.5 rounded-full bg-primary px-4 py-2'
                    : 'flex-row items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2'
                }
              >
                <Ionicons
                  name={f.icon}
                  size={15}
                  color={active ? colors.white : colors.textMuted}
                />
                <Text
                  className={
                    active
                      ? 'text-[13px] font-semibold text-white'
                      : 'text-[13px] font-medium text-gray-600'
                  }
                >
                  {f.key}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Listing */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingTop: 16 }}
      >
        {visible.map((service) => (
          <ServiceRow
            key={service.id}
            service={service}
            onPress={() =>
              router.push({
                pathname: '/artisan/[id]',
                params: { id: getCategoryArtisanId(category.id) },
              })
            }
          />
        ))}
      </ScrollView>

      {/* Search (open to guests) */}
      <SearchSheet
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </SafeAreaView>
  );
}
