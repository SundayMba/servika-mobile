import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { colors } from '@/constants/colors';
import { RECENT_SEARCHES, type RecentSearch } from '@/constants/home-data';

type SearchSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Fired when a recent search term is tapped. */
  onSelectRecent?: (term: RecentSearch) => void;
};

export function SearchSheet({
  visible,
  onClose,
  onSelectRecent,
}: SearchSheetProps) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState(RECENT_SEARCHES);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      className="h-[60%]"
      estimatedHeight={460}
    >
      {/* Search input + filter */}
      <View className="h-12 flex-row items-center gap-2.5 rounded-2xl border border-gray-100 bg-background px-4">
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search services, artisans..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          className="flex-1 text-[14px] text-gray-900"
        />
        <Pressable accessibilityLabel="Filters" hitSlop={8}>
          <MaterialCommunityIcons
            name="tune-variant"
            size={20}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {/* Recent searches header */}
      <View className="mb-1 mt-6 flex-row items-center justify-between">
        <Text className="text-[15px] font-bold text-gray-900">
          Recent searches
        </Text>
        {recents.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setRecents([])}>
            <Text className="text-[13px] font-semibold text-primary">
              Clear all
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Recent searches list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {recents.length === 0 ? (
          <Text className="py-6 text-[14px] text-gray-400">
            No recent searches.
          </Text>
        ) : (
          recents.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => onSelectRecent?.(item)}
              className="flex-row items-center gap-3 py-3 active:opacity-70"
            >
              <View
                style={{ backgroundColor: `${item.tint}14` }}
                className="h-10 w-10 items-center justify-center rounded-xl"
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={item.tint}
                />
              </View>
              <Text className="flex-1 text-[15px] font-medium text-gray-800">
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
              />
            </Pressable>
          ))
        )}
      </ScrollView>
    </BottomSheet>
  );
}
