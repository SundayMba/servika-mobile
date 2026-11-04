import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { usePastArtisans } from '@/lib/booking/hooks';
import type { PastArtisan } from '@/lib/booking/types';
import { artisanPhotoSource } from '@/lib/catalogue/assets';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

/**
 * "Artisans you've booked" (Business Model v1.4, section 15): the customer's own history, with
 * Book again. Requests by name go to that artisan first; if they pass, rotation takes over.
 */
export function PastArtisansRail({ onBook, inset = 0 }: { onBook: (a: PastArtisan) => void; inset?: number }) {
  const router = useRouter();
  const { data } = usePastArtisans();
  const list = (data ?? []).filter((a) => a.canBook);
  if (list.length === 0) return null;
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.head, { paddingHorizontal: inset }]}>
        <AppText weight="semibold" style={styles.title}>Artisans you&apos;ve booked</AppText>
        {list.length > 2 ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/past-artisans')}>
            <AppText weight="medium" style={styles.link}>See all</AppText>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: inset }}>
        {list.slice(0, 6).map((a) => {
          // A real photo or initials: stand-in image keys render as an empty grey circle.
          const photo = a.photoUrl ? artisanPhotoSource(a.photoUrl) : undefined;
          return (
            <View key={a.artisanId} style={styles.card}>
              <View style={styles.row}>
                {photo ? (
                  <Image source={photo} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.initials]}>
                    <AppText weight="semibold" style={styles.initialsText}>{initials(a.fullName)}</AppText>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <AppText weight="semibold" numberOfLines={1} style={styles.name}>{a.fullName}</AppText>
                  <AppText numberOfLines={1} style={styles.meta}>{a.specialty}</AppText>
                </View>
              </View>
              <View style={styles.footer}>
                <AppText style={styles.meta}>
                  {a.jobsWithYou} job{a.jobsWithYou === 1 ? '' : 's'} with you{a.isAway ? ' · away' : ''}
                </AppText>
                <Pressable accessibilityRole="button" accessibilityLabel={`Book ${a.fullName} again`} onPress={() => onBook(a)} style={styles.again}>
                  <Ionicons name="refresh" size={13} color={colors.accentDeep} />
                  <AppText weight="semibold" style={styles.againText}>Book again</AppText>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 18, letterSpacing: -0.4, color: colors.ink },
  link: { fontSize: 13, color: colors.accentDeep },
  card: { width: 258, gap: 14, padding: 14, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.hairline },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.sand },
  initials: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1E4' },
  initialsText: { fontSize: 15, color: colors.accentDeep },
  name: { fontSize: 15, color: colors.ink },
  meta: { fontSize: 12.5, color: colors.inkMuted },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  again: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 34, borderRadius: 11, backgroundColor: '#FFF1E4' },
  againText: { fontSize: 12.5, color: colors.accentDeep },
});
