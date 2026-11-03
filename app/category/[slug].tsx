import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { PriceCover } from '@/components/pricebook/PriceCover';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { formatNaira } from '@/lib/catalogue/assets';
import { durationLabel, useCategoryPriceBook } from '@/lib/pricebook/hooks';
import type { PriceBookItem } from '@/lib/pricebook/types';

const GUTTER = 20;

function JobRow({ item, first, onPress }: { item: PriceBookItem; first: boolean; onPress: () => void }) {
  const [pressed, setPressed] = useState(false);
  const duration = durationLabel(item.durationMinutes);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatNaira(item.priceNaira ?? 0)}`}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.row, !first && styles.rowDivider, pressed && styles.rowPressed]}
    >
      <PriceCover photoUrl={item.photoUrl} categorySlug={item.categorySlug} compact style={styles.thumb} />
      <View style={styles.rowBody}>
        <AppText weight="semibold" numberOfLines={2} style={styles.rowName}>{item.name}</AppText>
        <AppText numberOfLines={2} style={styles.rowScope}>{item.scope}</AppText>
        {duration ? <AppText style={styles.rowMeta}>{duration}</AppText> : null}
      </View>
      <View style={styles.rowPrice}>
        <AppText weight="semibold" style={styles.price}>{formatNaira(item.priceNaira ?? 0)}</AppText>
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      </View>
    </Pressable>
  );
}

/**
 * A trade, opened from "What needs fixing?" (Business Model v1.4, section 7). Three ways in, in the
 * order a customer thinks: a job with a fixed Servika price; "not sure what's wrong", where an artisan
 * looks first; and anything else, described in their own words. The customer never picks a pricing
 * type, they pick what matches their problem.
 */
export default function CategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug, name } = useLocalSearchParams<{ slug: string; name?: string }>();
  const { data, isLoading, isError, refetch, isRefetching } = useCategoryPriceBook(slug);
  const { guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();

  const title = data?.categoryName ?? name ?? 'Service';
  const describe = (mode: 'diagnosis' | 'custom') =>
    guard(() =>
      router.push({
        pathname: '/booking/request',
        params: { categorySlug: slug, open: '1', service: title, mode },
      }),
    );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText weight="semibold" numberOfLines={1} style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>Prices set by Servika</AppText>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 22 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accentDeep} colors={[colors.accentDeep]} />}
      >
        {/* The trade at work, with the promise in one line. */}
        <View style={[styles.gutter, styles.banner]}>
          <PriceCover photoUrl={null} categorySlug={slug} side="right" style={StyleSheet.absoluteFill} />
          <View style={styles.bannerText}>
            <AppText weight="semibold" style={styles.bannerTitle}>One price.{'\n'}No haggling.</AppText>
            <AppText style={styles.bannerSub}>Paid in the app, held until the job is done.</AppText>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accentDeep} style={{ marginTop: 24 }} />
        ) : isError || !data ? (
          <View style={[styles.gutter, styles.card, styles.empty]}>
            <AppText style={styles.emptyText}>Prices did not load. Pull down to try again.</AppText>
          </View>
        ) : (
          <>
            {data.fixedJobs.length > 0 ? (
              <View style={{ gap: 10 }}>
                <AppText weight="semibold" style={[styles.gutter, styles.section]}>Fixed-price jobs</AppText>
                <View style={[styles.gutter, styles.card]}>
                  {data.fixedJobs.map((item, i) => (
                    <JobRow
                      key={item.id}
                      item={item}
                      first={i === 0}
                      onPress={() => router.push({ pathname: '/job/[id]', params: { id: item.id } })}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={{ gap: 10 }}>
              <AppText weight="semibold" style={[styles.gutter, styles.section]}>
                {data.fixedJobs.length > 0 ? 'Not on the list?' : 'Book a visit'}
              </AppText>
              <Pressable accessibilityRole="button" onPress={() => describe('diagnosis')} style={[styles.gutter, styles.card, styles.option]}>
                <View style={[styles.optionIcon, { backgroundColor: colors.accentTint }]}>
                  <Ionicons name="search-outline" size={20} color={colors.accentDeep} />
                </View>
                <View style={styles.optionBody}>
                  <AppText weight="semibold" style={styles.optionTitle}>Not sure what&apos;s wrong?</AppText>
                  <AppText style={styles.optionSub}>
                    {data.diagnosisFeeNaira > 0
                      ? `A ${formatNaira(data.diagnosisFeeNaira)} visit to find the fault, taken off the repair. Repairs come from Servika's list and you approve them first.`
                      : "An artisan finds the fault and prices the repair from Servika's list. You approve before any work starts."}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => describe('custom')} style={[styles.gutter, styles.card, styles.option]}>
                <View style={[styles.optionIcon, { backgroundColor: colors.sandSunk }]}>
                  <Ionicons name="create-outline" size={20} color={colors.ink} />
                </View>
                <View style={styles.optionBody}>
                  <AppText weight="semibold" style={styles.optionTitle}>Something else? Describe it</AppText>
                  <AppText style={styles.optionSub}>
                    Installations and bigger work. You get an itemised quote, checked against what similar jobs cost.
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>

      <AuthPromptSheet visible={promptVisible} onClose={hidePrompt} onSignedIn={onSignedIn} reason="book" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  gutter: { marginHorizontal: GUTTER },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: GUTTER, paddingBottom: 14 },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  title: { fontSize: 22, letterSpacing: -0.5, color: colors.ink },
  subtitle: { fontSize: 12.5, color: colors.inkSubtle },

  banner: { height: 150, borderRadius: 24, overflow: 'hidden', justifyContent: 'center' },
  bannerText: { width: '55%', paddingLeft: 18, gap: 6 },
  bannerTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: colors.ink },
  bannerSub: { fontSize: 12, lineHeight: 16, color: colors.inkMuted },

  section: { fontSize: 16, letterSpacing: -0.2, color: colors.ink },
  card: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden' },
  empty: { padding: 20 },
  emptyText: { fontSize: 13.5, textAlign: 'center', color: colors.inkMuted },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  rowPressed: { backgroundColor: '#FBFAF8' },
  thumb: { width: 64, height: 64, borderRadius: 16 },
  rowBody: { flex: 1, gap: 3 },
  rowName: { fontSize: 14.5, color: colors.ink },
  rowScope: { fontSize: 12, lineHeight: 16, color: colors.inkMuted },
  rowMeta: { fontSize: 11.5, color: colors.inkSubtle },
  rowPrice: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 15, color: colors.ink },

  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  optionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optionBody: { flex: 1, gap: 3 },
  optionTitle: { fontSize: 14.5, color: colors.ink },
  optionSub: { fontSize: 12.5, lineHeight: 17, color: colors.inkMuted },
});
