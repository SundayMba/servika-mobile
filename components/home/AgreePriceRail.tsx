import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { categoryImage } from '@/lib/catalogue/assets';
import type { Category } from '@/lib/catalogue/types';

const GUTTER = 22;

/**
 * "Agree a price" (customer Home v2): the quote path, next to the fixed-price
 * rail so the two ways of paying sit side by side in the same language. You
 * describe the job, artisans name a price, you can counter on labour up to
 * three rounds. Each card opens the category with the open-request flow.
 */
function AgreePriceCardBase({ category, onPress }: { category: Category; onPress: () => void }) {
  const art = categoryImage(category.slug);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ask for a price on ${category.name}`} onPress={onPress} style={styles.card}>
      <View style={styles.icon}>{art ? <Image source={art} contentFit="contain" style={{ width: 34, height: 34 }} /> : <Ionicons name="construct-outline" size={20} color={colors.accentDeep} />}</View>
      <View style={{ flex: 1 }}>
        <AppText weight="semibold" numberOfLines={1} style={styles.name}>
          {category.name}
        </AppText>
        <AppText numberOfLines={1} style={styles.meta}>
          Agree a price · up to 3 rounds
        </AppText>
      </View>
      <View style={styles.ask}>
        <AppText weight="semibold" style={styles.askLabel}>
          Ask price
        </AppText>
      </View>
    </Pressable>
  );
}

const AgreePriceCard = memo(AgreePriceCardBase);

export function AgreePriceRail({ categories, onPress }: { categories: Category[]; onPress: (c: Category) => void }) {
  if (categories.length === 0) return null;
  // Two rows of cards, scrolled horizontally as column pairs.
  const pairs: Category[][] = [];
  for (let i = 0; i < categories.length; i += 2) pairs.push(categories.slice(i, i + 2));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
      {pairs.map((pair, i) => (
        <View key={i} style={styles.column}>
          {pair.map((c) => (
            <AgreePriceCard key={c.slug} category={c} onPress={() => onPress(c)} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rail: { paddingHorizontal: GUTTER, gap: 12 },
  column: { gap: 12, width: 268 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  icon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sandSunk },
  name: { fontSize: 14.5, color: colors.ink },
  meta: { marginTop: 2, fontSize: 12, color: colors.inkMuted },
  ask: { height: 34, paddingHorizontal: 12, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  askLabel: { fontSize: 12.5, color: colors.white },
});
