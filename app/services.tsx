import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FixedPriceCard,
  toFixedPriceCard,
  useFixedPriceCardWidth,
} from '@/components/home/FixedPriceRail';
import { AppText } from '@/components/ui/AppText';
import { colors, fonts } from '@/constants/colors';
import { useNearbyServices } from '@/lib/catalogue/hooks';
import type { FeaturedService } from '@/lib/catalogue/types';
import { useSelectedArea, useSelectedCoords } from '@/lib/location/areaStore';

type SortKey = 'best' | 'price' | 'nearest' | 'rated';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'best', label: 'Best match' },
  { key: 'price', label: 'Lowest price' },
  { key: 'nearest', label: 'Nearest' },
  { key: 'rated', label: 'Top rated' },
];

/** The server order is "best match" (available → reputation → distance). */
function sortServices(list: FeaturedService[], sort: SortKey): FeaturedService[] {
  if (sort === 'best') return list;
  const copy = [...list];
  if (sort === 'price') copy.sort((a, b) => a.priceNaira - b.priceNaira);
  if (sort === 'rated') copy.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  if (sort === 'nearest')
    copy.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return copy;
}

/**
 * "Services close to you" — every fixed-price service customers can book in one
 * tap, as a single column of the same cards Home shows, full width so the info
 * block has room. Search filters by service or provider name; the chips re-sort
 * client-side (the list is small). Only live listings here: this screen is a
 * catalogue, so no example cards.
 */
export default function ServicesCloseToYou() {
  const router = useRouter();
  const coords = useSelectedCoords();
  const area = useSelectedArea();
  const query = useNearbyServices(coords);
  const cardWidth = useFixedPriceCardWidth('list');

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('best');

  const items = useMemo(() => {
    const all = query.data ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (s) => s.name.toLowerCase().includes(q) || s.artisanName.toLowerCase().includes(q),
        )
      : all;
    return sortServices(filtered, sort).map(toFixedPriceCard);
  }, [query.data, search, sort]);

  const total = query.data?.length ?? 0;
  const hasDistances = (query.data ?? []).some((s) => s.distanceKm != null);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText weight="semibold" style={styles.title}>
            Services close to you
          </AppText>
          <AppText numberOfLines={1} style={styles.subtitle}>
            {total > 0 ? `${total} fixed-price ${total === 1 ? 'service' : 'services'} · ${area}` : area}
          </AppText>
        </View>
      </View>

      {/* Search */}
      <View style={styles.search}>
        <Ionicons name="search-outline" size={19} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search braids, cleaning, AC servicing…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {search ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Sort chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {SORTS.filter((s) => s.key !== 'nearest' || hasDistances).map((s) => {
          const active = s.key === sort;
          return (
            <Pressable
              key={s.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setSort(s.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <AppText weight="medium" style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {s.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="pricetags-outline" size={26} color={colors.accentDeep} />
          </View>
          <AppText weight="semibold" style={styles.emptyTitle}>
            {query.isError
              ? "Couldn't load services"
              : search
                ? 'No matches'
                : 'No fixed-price services here yet'}
          </AppText>
          <AppText style={styles.emptyBody}>
            {query.isError
              ? 'Pull down to try again.'
              : search
                ? 'Try another word, or clear the search.'
                : 'Providers near you are still publishing prices. You can still book any artisan and agree a price.'}
          </AppText>
          {!search && !query.isError ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/categories')}
              style={styles.emptyCta}
            >
              <AppText weight="semibold" style={styles.emptyCtaLabel}>
                Browse all services
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          {items.map((item) => (
            <FixedPriceCard
              key={item.key}
              item={item}
              width={cardWidth}
              onPress={() =>
                router.push({ pathname: '/service/[id]', params: { id: item.key } })
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const GUTTER = 22;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  back: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 19,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 1,
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  search: {
    marginHorizontal: 20,
    marginTop: 6,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
  },
  chips: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipLabel: {
    fontSize: 12.5,
    color: colors.inkMuted,
  },
  chipLabelActive: {
    color: colors.white,
  },
  grid: {
    gap: 14,
    paddingHorizontal: GUTTER,
    paddingTop: 2,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyIcon: {
    height: 56,
    width: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentTint,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 16,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  emptyCtaLabel: {
    fontSize: 13.5,
    color: colors.white,
  },
});
