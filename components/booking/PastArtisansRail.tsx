import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { usePastArtisans } from '@/lib/booking/hooks';
import type { PastArtisan } from '@/lib/booking/types';
import { artisanPhotoSource } from '@/lib/catalogue/assets';

/**
 * "Artisans you've booked" (Business Model v1.4, section 15): the customer's own history, with
 * Book again. Requests by name skip rotation; if the artisan passes, rotation takes over.
 */
export function PastArtisansRail({ onBook }: { onBook: (a: PastArtisan) => void }) {
  const router = useRouter();
  const { data } = usePastArtisans();
  const list = (data ?? []).filter((a) => a.canBook);
  if (list.length === 0) return null;
  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-center justify-between">
        <AppText weight="semibold" className="text-[15px] text-gray-900">Artisans you&apos;ve booked</AppText>
        {list.length > 3 ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/past-artisans')}>
            <AppText weight="semibold" className="text-[13px]" style={{ color: colors.accentDeep }}>See all</AppText>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {list.slice(0, 6).map((a) => (
          <View key={a.artisanId} className="w-[196px] rounded-2xl border border-gray-100 bg-white p-3">
            <View className="flex-row items-center gap-2.5">
              <Image source={artisanPhotoSource(a.photoUrl, a.imageKey)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE' }} contentFit="cover" />
              <View className="flex-1">
                <AppText weight="semibold" className="text-[14px] text-gray-900" numberOfLines={1}>{a.fullName}</AppText>
                <AppText className="text-[12px] text-gray-500" numberOfLines={1}>{a.specialty}</AppText>
              </View>
            </View>
            <AppText className="mt-2 text-[12px] text-gray-500">
              {a.jobsWithYou} job{a.jobsWithYou === 1 ? '' : 's'} with you{a.isAway ? ' · away now' : ''}
            </AppText>
            <Pressable accessibilityRole="button" accessibilityLabel={`Book ${a.fullName} again`} onPress={() => onBook(a)} className="mt-3 h-10 flex-row items-center justify-center gap-1.5 rounded-xl bg-gray-900">
              <Ionicons name="refresh" size={14} color={colors.white} />
              <AppText weight="semibold" className="text-[13px] text-white">Book again</AppText>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
