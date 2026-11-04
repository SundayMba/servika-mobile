import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CantFindCard } from '@/components/home/CantFindCard';
import { InterestSheet } from '@/components/home/InterestSheet';
import { JobTile } from '@/components/home/JobTile';
import { ServiceListRow } from '@/components/home/ServiceSections';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { FALLBACK_CATEGORIES } from '@/constants/fallback-categories';
import { categoryImage } from '@/lib/catalogue/assets';
import { useCategories, useServiceSections } from '@/lib/catalogue/hooks';
import { useFeeSchedule } from '@/lib/payments/fees';

const TAB_BAR_HEIGHT = 60;
const GUTTER = 20;
const TILE_GAP = 10;

/**
 * Services: everything Servika offers in one place. Describe a job in any trade (artisans send prices),
 * or book one of the standard services artisans post at a set price, checked by Servika. Search covers
 * the standard services by name, trade or artisan. Coming soon shows only when an admin switches it on.
 */
export default function ServicesTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - GUTTER * 2 - TILE_GAP * 2) / 3);
  const categoriesQuery = useCategories();
  const sectionsQuery = useServiceSections();
  const showComingSoon = !!useFeeSchedule().data?.showComingSoonServices;
  const [query, setQuery] = useState('');
  const [interest, setInterest] = useState<{ slug: string; name: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categories = categoriesQuery.data ?? (categoriesQuery.isError ? FALLBACK_CATEGORIES : []);
  const trades = categories.filter((c) => c.isPopular);
  const comingSoon = categories.filter((c) => !c.isPopular);
  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      q
        ? sections.flatMap((s) =>
            s.services.filter((p) => [p.name, p.artisanName, s.categoryName].some((t) => t.toLowerCase().includes(q))),
          )
        : [],
    [sections, q],
  );
  const tradeMatches = q ? trades.filter((c) => c.name.toLowerCase().includes(q)) : [];

  const openTrade = (slug: string, name: string) => router.push({ pathname: '/category/[slug]', params: { slug, name } });
  const openPost = (id: string) => router.push({ pathname: '/service/[id]', params: { id } });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([categoriesQuery.refetch(), sectionsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />
      <View style={styles.head}>
        <AppText weight="semibold" style={styles.title}>Services</AppText>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.inkSubtle} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search services, e.g. ceiling fan"
            placeholderTextColor={colors.inkFaint}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.inkSubtle} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 28, gap: 26 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentDeep} colors={[colors.accentDeep]} />}
      >
        {q ? (
          // ── Search results ──
          <View style={{ gap: 12 }}>
            {tradeMatches.map((c) => (
              <Pressable key={c.slug} accessibilityRole="button" onPress={() => openTrade(c.slug, c.name)} style={[styles.gutter, styles.describe]}>
                <Ionicons name="create-outline" size={18} color={colors.accentDeep} />
                <AppText weight="semibold" style={{ flex: 1, fontSize: 14, color: colors.ink }}>Describe a {c.name.toLowerCase()} job</AppText>
                <Ionicons name="arrow-forward" size={16} color={colors.ink} />
              </Pressable>
            ))}
            {matches.length > 0 ? (
              <View style={[styles.gutter, styles.card]}>
                {matches.map((p, i) => (
                  <ServiceListRow key={p.serviceId} item={p} first={i === 0} onPress={() => openPost(p.serviceId)} />
                ))}
              </View>
            ) : tradeMatches.length === 0 ? (
              <View style={[styles.gutter, styles.empty]}>
                <AppText weight="semibold" style={styles.emptyTitle}>No standard service matches &ldquo;{query.trim()}&rdquo;</AppText>
                <AppText style={styles.emptyBody}>Pick a trade below and describe the job instead. Artisans send their prices.</AppText>
              </View>
            ) : null}
            <CantFindCard onPress={() => setAsking(true)} style={styles.gutter} />
          </View>
        ) : (
          <>
            {/* ── Every bookable trade: describe the job, get prices ── */}
            <View style={{ gap: 12 }}>
              <View style={styles.gutter}>
                <AppText weight="semibold" style={styles.section}>Describe a job</AppText>
                <AppText style={styles.sectionSub}>Pick the trade. Checked artisans send prices and you choose.</AppText>
              </View>
              {categoriesQuery.isLoading ? (
                <ActivityIndicator color={colors.accentDeep} />
              ) : (
                <View style={styles.grid}>
                  {trades.map((c) => (
                    <JobTile key={c.id} label={c.name} image={categoryImage(c.slug)} tint={c.tint} width={tileWidth} onPress={() => openTrade(c.slug, c.name)} />
                  ))}
                </View>
              )}
            </View>

            {/* ── Standard services by trade ── */}
            {sectionsQuery.isLoading ? (
              <ActivityIndicator color={colors.accentDeep} />
            ) : sections.length > 0 ? (
              <View style={{ gap: 14 }}>
                <View style={styles.gutter}>
                  <AppText weight="semibold" style={styles.section}>Standard services</AppText>
                  <AppText style={styles.sectionSub}>Set prices from checked artisans. Book in a tap.</AppText>
                </View>
                {sections.map((s) => (
                  <View key={s.categorySlug} style={{ gap: 8 }}>
                    <View style={[styles.gutter, styles.subRow]}>
                      <AppText weight="semibold" style={styles.subhead}>{s.categoryName}</AppText>
                      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => openTrade(s.categorySlug, s.categoryName)}>
                        <AppText weight="medium" style={styles.link}>See all</AppText>
                      </Pressable>
                    </View>
                    <View style={[styles.gutter, styles.card]}>
                      {s.services.slice(0, 4).map((p, i) => (
                        <ServiceListRow key={p.serviceId} item={p} first={i === 0} onPress={() => openPost(p.serviceId)} />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <CantFindCard onPress={() => setAsking(true)} style={styles.gutter} />

            {showComingSoon && comingSoon.length > 0 ? (
              <View style={{ gap: 10 }}>
                <View style={styles.gutter}>
                  <AppText weight="semibold" style={styles.section}>Coming soon</AppText>
                  <AppText style={styles.sectionSub}>Not offered yet. Tap one to tell us you need it.</AppText>
                </View>
                <View style={[styles.gutter, styles.chips]}>
                  {comingSoon.map((c) => (
                    <Pressable key={c.id} accessibilityRole="button" onPress={() => setInterest({ slug: c.slug, name: c.name })} style={styles.chip}>
                      <View style={[styles.dot, { backgroundColor: c.tint || colors.inkSubtle }]} />
                      <AppText weight="medium" style={styles.chipLabel}>{c.name}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <InterestSheet
        visible={!!interest || asking}
        onClose={() => {
          setInterest(null);
          setAsking(false);
        }}
        category={interest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  gutter: { marginHorizontal: GUTTER },
  head: { paddingHorizontal: GUTTER, paddingBottom: 12, gap: 12 },
  title: { fontSize: 28, letterSpacing: -1, color: colors.ink },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  searchInput: { flex: 1, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  section: { fontSize: 19, letterSpacing: -0.4, color: colors.ink },
  sectionSub: { marginTop: 2, fontSize: 12.5, color: colors.inkSubtle },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: TILE_GAP, rowGap: 20, paddingHorizontal: GUTTER },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subhead: { fontSize: 15.5, color: colors.inkMuted },
  link: { fontSize: 13, color: colors.accentDeep },
  card: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden' },
  describe: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  empty: { padding: 18, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, gap: 4 },
  emptyTitle: { fontSize: 14.5, color: colors.ink },
  emptyBody: { fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, height: 38, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  dot: { width: 7, height: 7, borderRadius: 999 },
  chipLabel: { fontSize: 13, color: colors.ink },
});
