import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { colors } from '@/constants/colors';
import { artisanAvatar } from '@/lib/catalogue/assets';
import { useCategories, useNearbyArtisans } from '@/lib/catalogue/hooks';

type SearchSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Live search over the real catalogue. Empty query → popular services; typing →
 * matching services + artisans, filtered client-side over the cached catalogue.
 * Tapping a result closes the sheet and navigates to that category / artisan.
 */
export function SearchSheet({ visible, onClose }: SearchSheetProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { data: categories } = useCategories();
  const { data: artisans } = useNearbyArtisans();

  const q = query.trim().toLowerCase();

  const matchedCategories = useMemo(() => {
    const all = categories ?? [];
    if (!q) return all.filter((c) => c.isPopular).slice(0, 6);
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [categories, q]);

  const matchedArtisans = useMemo(() => {
    if (!q) return [];
    return (artisans ?? []).filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.specialty.toLowerCase().includes(q),
    );
  }, [artisans, q]);

  const noResults =
    q.length > 0 && matchedCategories.length === 0 && matchedArtisans.length === 0;

  const go = (navigate: () => void) => {
    setQuery('');
    onClose();
    navigate();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      fill
      className="h-[60%]"
      estimatedHeight={480}
    >
      {/* Search input */}
      <View className="h-12 flex-row items-center gap-2.5 rounded-2xl border border-gray-100 bg-background px-4">
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search services, artisans..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoFocus
          className="flex-1 text-[14px] text-gray-900"
        />
        {query.length > 0 ? (
          <Pressable accessibilityLabel="Clear" hitSlop={8} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        className="mt-4 flex-1"
      >
        {noResults ? (
          <View className="items-center py-10">
            <Ionicons name="search-outline" size={28} color={colors.textMuted} />
            <Text className="mt-2 text-[14px] text-gray-400">
              No results for &ldquo;{query.trim()}&rdquo;
            </Text>
          </View>
        ) : null}

        {/* Services */}
        {matchedCategories.length > 0 ? (
          <>
            <Text className="mb-1 text-[13px] font-bold uppercase tracking-wide text-gray-400">
              {q ? 'Services' : 'Popular services'}
            </Text>
            {matchedCategories.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={c.name}
                onPress={() =>
                  go(() =>
                    router.push({ pathname: '/category/[id]', params: { id: c.slug } }),
                  )
                }
                className="flex-row items-center gap-3 py-3 active:opacity-70"
              >
                <View
                  style={{ backgroundColor: `${c.tint}1A` }}
                  className="h-10 w-10 items-center justify-center rounded-xl"
                >
                  <Ionicons name="construct-outline" size={20} color={c.tint} />
                </View>
                <Text className="flex-1 text-[15px] font-medium text-gray-800">
                  {c.name}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </>
        ) : null}

        {/* Artisans */}
        {matchedArtisans.length > 0 ? (
          <>
            <Text className="mb-1 mt-4 text-[13px] font-bold uppercase tracking-wide text-gray-400">
              Artisans
            </Text>
            {matchedArtisans.map((a) => (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                accessibilityLabel={a.fullName}
                onPress={() =>
                  go(() =>
                    router.push({ pathname: '/artisan/[id]', params: { id: a.id } }),
                  )
                }
                className="flex-row items-center gap-3 py-2.5 active:opacity-70"
              >
                <View className="h-10 w-10 overflow-hidden rounded-full bg-background">
                  <Image
                    source={artisanAvatar(a.imageKey)}
                    contentFit="cover"
                    contentPosition="top"
                    style={{ flex: 1 }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-medium text-gray-800">
                    {a.fullName}
                  </Text>
                  <Text className="text-[12px] text-gray-400">{a.specialty}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}
