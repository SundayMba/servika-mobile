import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { ServiceListRow } from '@/components/home/ServiceSections';
import { PriceCover } from '@/components/pricebook/PriceCover';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { useCategories, useServiceSections } from '@/lib/catalogue/hooks';

const GUTTER = 20;

const STEPS: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [
  { icon: 'create-outline', text: 'Describe the job and add photos' },
  { icon: 'pricetags-outline', text: 'Checked artisans nearby send prices, or offer to visit first' },
  { icon: 'checkmark-circle-outline', text: 'You pick one. Pay in the app, held until it is done' },
];

/**
 * A trade, opened from "What needs fixing?". The main way in is to describe the job: checked artisans
 * nearby send their prices, or say they need to see it first, and the customer picks. Below it, the
 * trade's standard services: posts artisans publish at their own price, checked by Servika.
 */
export default function CategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug, name } = useLocalSearchParams<{ slug: string; name?: string }>();
  const categories = useCategories();
  const sections = useServiceSections(slug);
  const { guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();

  const title = name ?? categories.data?.find((c) => c.slug === slug)?.name ?? 'Service';
  const posts = sections.data?.find((s) => s.categorySlug === slug)?.services ?? [];

  const describe = () =>
    guard(() => router.push({ pathname: '/booking/request', params: { categorySlug: slug, open: '1', service: title } }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <AppText weight="semibold" numberOfLines={1} style={[styles.title, { flex: 1 }]}>{title}</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 22 }}
        refreshControl={<RefreshControl refreshing={sections.isRefetching} onRefresh={sections.refetch} tintColor={colors.accentDeep} colors={[colors.accentDeep]} />}
      >
        <View style={[styles.gutter, styles.banner]}>
          <PriceCover photoUrl={null} categorySlug={slug} side="right" style={StyleSheet.absoluteFill} />
          <View style={styles.bannerText}>
            <AppText weight="semibold" style={styles.bannerTitle}>Describe it.{'\n'}Get prices.</AppText>
            <AppText style={styles.bannerSub}>Artisans near you compete for the job. You choose.</AppText>
          </View>
        </View>

        <View style={[styles.gutter, styles.card, { padding: 16, gap: 14 }]}>
          {STEPS.map((s) => (
            <View key={s.text} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={s.icon} size={17} color={colors.accentDeep} />
              </View>
              <AppText style={styles.stepText}>{s.text}</AppText>
            </View>
          ))}
          <Pressable accessibilityRole="button" onPress={describe} style={styles.cta}>
            <AppText weight="semibold" style={styles.ctaLabel}>Describe your job</AppText>
            <Ionicons name="arrow-forward" size={17} color={colors.white} />
          </Pressable>
        </View>

        {sections.isLoading ? (
          <ActivityIndicator color={colors.accentDeep} />
        ) : posts.length > 0 ? (
          <View style={{ gap: 10 }}>
            <View style={styles.gutter}>
              <AppText weight="semibold" style={styles.section}>Standard services</AppText>
              <AppText style={styles.sectionNote}>Set prices from artisans, checked by Servika. Book in a tap.</AppText>
            </View>
            <View style={[styles.gutter, styles.card]}>
              {posts.map((p, i) => (
                <ServiceListRow key={p.serviceId} item={p} first={i === 0} onPress={() => router.push({ pathname: '/service/[id]', params: { id: p.serviceId } })} />
              ))}
            </View>
          </View>
        ) : null}
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

  banner: { height: 150, borderRadius: 24, overflow: 'hidden', justifyContent: 'center' },
  bannerText: { width: '55%', paddingLeft: 18, gap: 6 },
  bannerTitle: { fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: colors.ink },
  bannerSub: { fontSize: 12, lineHeight: 16, color: colors.inkMuted },

  card: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint },
  stepText: { flex: 1, fontSize: 13.5, lineHeight: 18, color: colors.ink },
  cta: { marginTop: 2, height: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.accentDeep },
  ctaLabel: { fontSize: 15, color: colors.white },

  section: { fontSize: 16, letterSpacing: -0.2, color: colors.ink },
  sectionNote: { marginTop: 2, fontSize: 12.5, lineHeight: 17, color: colors.inkSubtle },

});
