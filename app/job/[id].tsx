import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { PriceCover } from '@/components/pricebook/PriceCover';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { formatNaira } from '@/lib/catalogue/assets';
import { useFeeSchedule } from '@/lib/payments/fees';
import { durationLabel, usePriceBookItem } from '@/lib/pricebook/hooks';

const GUTTER = 20;
const HERO = 300;

type Icon = ComponentProps<typeof Ionicons>['name'];

const STEPS: { icon: Icon; title: string; body: string }[] = [
  { icon: 'lock-closed-outline', title: 'Pay now, safely', body: 'Your money is held by Servika, not the artisan.' },
  { icon: 'person-outline', title: 'Servika sends a checked artisan', body: 'You see who is coming, with their photo, before they arrive.' },
  { icon: 'checkmark-done-outline', title: 'Confirm when it is done', body: 'The artisan is paid only after you confirm the job.' },
];

function Fact({ icon, label }: { icon: Icon; label: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={16} color={colors.inkMuted} />
      <AppText style={styles.factText}>{label}</AppText>
    </View>
  );
}

/**
 * One fixed-price job from Servika's price book: what the price covers, how parts are charged, and
 * how the money moves. Booking goes through the usual when-and-where steps and ends at payment.
 */
export default function PriceBookJob() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading, isError } = usePriceBookItem(id);
  const usersBearFees = useFeeSchedule().data?.usersBearFees === true;
  const { guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();

  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (isLoading || isError || !item) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        {isLoading ? (
          <ActivityIndicator color={colors.accentDeep} />
        ) : (
          <View style={{ alignItems: 'center', gap: 14, paddingHorizontal: 32 }}>
            <AppText weight="semibold" style={styles.missingTitle}>This job is no longer offered</AppText>
            <AppText style={styles.missingBody}>Its price may have changed. Pick it again from the list.</AppText>
            <Pressable accessibilityRole="button" onPress={back} style={styles.missingButton}>
              <AppText weight="semibold" style={styles.ctaLabel}>Go back</AppText>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  const price = item.priceNaira ?? 0;
  const duration = durationLabel(item.durationMinutes);
  const book = () =>
    guard(() =>
      router.push({
        pathname: '/booking/request',
        params: {
          priceBookItemId: item.id,
          fixedPrice: String(price),
          service: item.name,
          categorySlug: item.categorySlug,
          open: '1',
        },
      }),
    );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>
        <PriceCover photoUrl={item.photoUrl} categorySlug={item.categorySlug} style={{ height: HERO + insets.top }} />

        <View style={styles.sheet}>
          <View style={styles.tradePill}>
            <AppText weight="medium" style={styles.tradeText}>{item.categoryName}</AppText>
          </View>
          <AppText weight="semibold" style={styles.name}>{item.name}</AppText>
          <View style={styles.priceRow}>
            <AppText weight="semibold" style={styles.price}>{formatNaira(price)}</AppText>
            <AppText style={styles.priceNote}>Servika&apos;s price for the work</AppText>
          </View>

          <View style={styles.card}>
            <AppText weight="semibold" style={styles.cardTitle}>What the price covers</AppText>
            <AppText style={styles.scope}>{item.scope || item.name}</AppText>
            <View style={styles.facts}>
              {duration ? <Fact icon="time-outline" label={duration} /> : null}
              <Fact icon="construct-outline" label={item.partsNote ?? 'No parts needed for the usual job'} />
              <Fact icon="pricetag-outline" label="No call-out fee. No haggling at your door." />
            </View>
          </View>

          <View style={styles.card}>
            <AppText weight="semibold" style={styles.cardTitle}>How it works</AppText>
            {STEPS.map((step, i) => (
              <View key={step.title} style={[styles.step, i > 0 && styles.stepDivider]}>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon} size={18} color={colors.accentDeep} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText weight="semibold" style={styles.stepTitle}>{step.title}</AppText>
                  <AppText style={styles.stepBody}>{step.body}</AppText>
                </View>
              </View>
            ))}
          </View>

          <AppText style={styles.small}>
            If the job turns out bigger than this, the artisan tells you the extra in the app first. Nothing is added
            without your yes. Cancel before the artisan arrives and you get your money back.
          </AppText>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={back}
        style={[styles.back, { top: insets.top + 10 }]}
      >
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
      </Pressable>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={{ flex: 1 }}>
          <AppText weight="semibold" style={styles.footerPrice}>{formatNaira(price)}</AppText>
          <AppText style={styles.footerNote}>{usersBearFees ? 'Plus a small payment fee' : 'Paid in the app'}</AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={book} style={styles.cta}>
          <AppText weight="semibold" style={styles.ctaLabel}>Book this job</AppText>
          <Ionicons name="arrow-forward" size={18} color={colors.orangeLabel} />
        </Pressable>
      </View>

      <AuthPromptSheet visible={promptVisible} onClose={hidePrompt} onSignedIn={onSignedIn} reason="book" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  center: { alignItems: 'center', justifyContent: 'center' },
  back: { position: 'absolute', left: GUTTER, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.94)' },

  sheet: { marginTop: -26, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.sand, paddingHorizontal: GUTTER, paddingTop: 22, gap: 14 },
  tradePill: { alignSelf: 'flex-start', paddingHorizontal: 10, height: 26, justifyContent: 'center', borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  tradeText: { fontSize: 11.5, color: colors.inkMuted },
  name: { fontSize: 26, lineHeight: 31, letterSpacing: -0.7, color: colors.ink },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: -4 },
  price: { fontSize: 24, letterSpacing: -0.4, color: colors.accentDeep },
  priceNote: { flexShrink: 1, fontSize: 12.5, color: colors.inkSubtle },

  card: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline, padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, color: colors.ink },
  scope: { fontSize: 14, lineHeight: 20, color: colors.inkMuted },
  facts: { gap: 9, marginTop: 2 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  factText: { flex: 1, fontSize: 13, color: colors.ink },

  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  stepDivider: { borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 12 },
  stepIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint },
  stepTitle: { fontSize: 13.5, color: colors.ink },
  stepBody: { fontSize: 12.5, lineHeight: 17, color: colors.inkMuted },
  small: { fontSize: 12, lineHeight: 17, color: colors.inkSubtle, paddingHorizontal: 4 },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: GUTTER, paddingTop: 14, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.hairline },
  footerPrice: { fontSize: 19, color: colors.ink },
  footerNote: { fontSize: 11.5, color: colors.inkSubtle },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 22, borderRadius: 16, backgroundColor: colors.orange },
  ctaLabel: { fontSize: 15, color: colors.orangeLabel },

  missingTitle: { fontSize: 18, textAlign: 'center', color: colors.ink },
  missingBody: { fontSize: 13.5, textAlign: 'center', color: colors.inkMuted },
  missingButton: { height: 48, paddingHorizontal: 24, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.orange },
});
