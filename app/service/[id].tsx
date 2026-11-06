import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { durationLabel, serviceCover } from '@/components/home/ServiceSections';
import { PhotoViewer } from '@/components/PhotoViewer';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { formatNaira } from '@/lib/catalogue/assets';
import { distanceLabel } from '@/lib/catalogue/display';
import { invalidateCatalogueLists, useArtisan, useService } from '@/lib/catalogue/hooks';
import { useOpenChat } from '@/lib/chat/hooks';
import { config } from '@/lib/config';

const GUTTER = 20;

/**
 * One standard service an artisan offers at their own price, after Servika checked the post and its
 * photo. Shows what the price covers, the artisan behind it (no stars: ratings are Servika's, not
 * public) and their recent work. Booking it sends the request to that artisan at this price.
 */
export default function ServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { data: service, isLoading, isError } = useService(id);
  const { data: artisan } = useArtisan(service?.artisanId);
  const { guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();
  const { openWithArtisan } = useOpenChat();
  const [viewer, setViewer] = useState<number | null>(null);

  useEffect(() => {
    if (isError) void invalidateCatalogueLists(queryClient);
  }, [isError, queryClient]);

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.accentDeep} />
      </View>
    );
  }
  if (isError || !service) {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: 32 }]}>
        <Ionicons name="construct-outline" size={34} color={colors.inkSubtle} />
        <AppText weight="semibold" style={styles.goneTitle}>This service is not available</AppText>
        <AppText style={styles.goneBody}>The artisan may have paused it.</AppText>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={[styles.book, { marginTop: 18, alignSelf: 'stretch' }]}>
          <AppText weight="semibold" style={styles.bookLabel}>Go back</AppText>
        </Pressable>
      </View>
    );
  }

  const cover = serviceCover(service);
  const first = service.artisanName.split(' ')[0];
  const work = (artisan?.galleryUrls ?? []).map((u) => ({ uri: `${config.apiBaseUrl}${u}` }));
  const facts = [
    durationLabel(service.durationMinutes) ? { icon: 'time-outline' as const, text: `About ${durationLabel(service.durationMinutes)}` } : null,
    distanceLabel(service.distanceKm) ? { icon: 'location-outline' as const, text: `${distanceLabel(service.distanceKm)} from you` } : null,
    { icon: 'lock-closed-outline' as const, text: 'Paid in the app, held until done' },
  ].filter(Boolean) as { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[];

  const book = () =>
    guard(() =>
      router.push({
        pathname: '/booking/request',
        params: {
          service: service.name,
          artisanId: service.artisanId,
          artisanServiceId: service.serviceId,
          fixedPrice: String(service.priceNaira),
          ...(service.categorySlug ? { categorySlug: service.categorySlug } : {}),
        },
      }),
    );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: Math.round(width * 0.82), backgroundColor: colors.accentTint }}>
          {cover ? <Image source={cover} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} transition={150} /> : null}
        </View>

        <View style={styles.body}>
          <AppText weight="semibold" style={styles.name}>{service.name}</AppText>
          <View style={styles.priceRow}>
            <AppText weight="semibold" style={styles.price}>{formatNaira(service.priceNaira)}</AppText>
            <View style={styles.checked}>
              <Ionicons name="shield-checkmark" size={12} color={colors.onlineInk} />
              <AppText weight="semibold" style={styles.checkedLabel}>Checked by Servika</AppText>
            </View>
          </View>
          <AppText style={styles.priceNote}>{first}&apos;s set price for this job. You pay it once {first} accepts.</AppText>

          <View style={styles.facts}>
            {facts.map((f) => (
              <View key={f.text} style={styles.fact}>
                <Ionicons name={f.icon} size={15} color={colors.accentDeep} />
                <AppText style={styles.factText}>{f.text}</AppText>
              </View>
            ))}
          </View>

          {service.includes && service.includes.length > 0 ? (
            <View style={styles.block}>
              <AppText weight="semibold" style={styles.blockTitle}>What the price covers</AppText>
              {service.includes.map((line) => (
                <View key={line} style={styles.include}>
                  <Ionicons name="checkmark-circle" size={17} color={colors.onlineInk} />
                  <AppText style={styles.includeText}>{line}</AppText>
                </View>
              ))}
            </View>
          ) : null}

          {service.description ? (
            <View style={styles.block}>
              <AppText weight="semibold" style={styles.blockTitle}>About this service</AppText>
              <AppText style={styles.description}>{service.description}</AppText>
            </View>
          ) : null}

          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/artisan/[id]', params: { id: service.artisanId } })} style={styles.provider}>
            <View style={styles.avatar}>
              {service.artisanPhotoUrl ? (
                <Image source={{ uri: `${config.apiBaseUrl}${service.artisanPhotoUrl}` }} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill} />
              ) : (
                <AppText weight="semibold" style={styles.avatarLetter}>{service.artisanName.charAt(0).toUpperCase()}</AppText>
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <AppText weight="semibold" numberOfLines={1} style={styles.providerName}>{service.artisanName}</AppText>
                {service.hasCertificate ? <Ionicons name="ribbon" size={13} color={colors.accentDeep} /> : null}
              </View>
              <AppText numberOfLines={1} style={styles.providerMeta}>
                ID checked{artisan?.completedJobs ? ` · ${artisan.completedJobs} jobs on Servika` : ''}
                {artisan?.specialty ? ` · ${artisan.specialty}` : ''}
              </AppText>
            </View>
            <AppText weight="medium" style={styles.profileLink}>Profile</AppText>
          </Pressable>

          {work.length > 0 ? (
            <View style={styles.block}>
              <AppText weight="semibold" style={styles.blockTitle}>{first}&apos;s recent work</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {work.map((p, i) => (
                  <Pressable key={p.uri} accessibilityRole="imagebutton" accessibilityLabel={`Work photo ${i + 1}`} onPress={() => setViewer(i)} style={styles.workThumb}>
                    <Image source={p} contentFit="cover" style={StyleSheet.absoluteFill} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => router.back()}
        style={[styles.backBtn, { top: insets.top + 8 }]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
      </Pressable>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Message ${first}`} onPress={() => guard(() => openWithArtisan(service.artisanId, service.artisanName))} style={styles.chat}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.accentDeep} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={book} style={styles.book}>
          <AppText weight="semibold" style={styles.bookLabel}>Book for {formatNaira(service.priceNaira)}</AppText>
        </Pressable>
      </View>

      {work.length > 0 ? <PhotoViewer photos={work} initialIndex={viewer ?? 0} visible={viewer !== null} onClose={() => setViewer(null)} /> : null}
      <AuthPromptSheet visible={promptVisible} onClose={hidePrompt} onSignedIn={onSignedIn} reason="book" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sand },
  center: { alignItems: 'center', justifyContent: 'center' },
  goneTitle: { marginTop: 12, fontSize: 17, textAlign: 'center', color: colors.ink },
  goneBody: { marginTop: 6, fontSize: 13.5, lineHeight: 19, textAlign: 'center', color: colors.inkMuted },

  body: { marginTop: -24, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.sand, paddingHorizontal: GUTTER, paddingTop: 22, gap: 6 },
  name: { fontSize: 23, lineHeight: 28, letterSpacing: -0.5, color: colors.ink },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  price: { fontSize: 24, color: colors.ink },
  checked: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: '#E6F5EE' },
  checkedLabel: { fontSize: 11, color: colors.onlineInk },
  priceNote: { fontSize: 12.5, lineHeight: 17, color: colors.inkSubtle },
  facts: { marginTop: 12, gap: 8, padding: 14, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  factText: { fontSize: 13.5, color: colors.ink },
  block: { marginTop: 20, gap: 10 },
  blockTitle: { fontSize: 16, letterSpacing: -0.2, color: colors.ink },
  include: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  includeText: { flex: 1, fontSize: 14, lineHeight: 19, color: colors.ink },
  description: { fontSize: 14, lineHeight: 20, color: colors.inkMuted },
  provider: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  avatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentTint },
  avatarLetter: { fontSize: 18, color: colors.accentDeep },
  providerName: { flexShrink: 1, fontSize: 15, color: colors.ink },
  providerMeta: { fontSize: 12, color: colors.inkSubtle },
  profileLink: { fontSize: 13, color: colors.accentDeep },
  workThumb: { width: 120, height: 150, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.hairline },

  backBtn: { position: 'absolute', left: GUTTER, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: GUTTER, paddingTop: 12, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.hairline },
  chat: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairlineStrong },
  book: { flex: 1, height: 54, borderRadius: 16, alignItems: 'stretch', justifyContent: 'center', backgroundColor: colors.accentDeep },
  bookLabel: { fontSize: 15.5, textAlign: 'center', color: colors.white },
});
