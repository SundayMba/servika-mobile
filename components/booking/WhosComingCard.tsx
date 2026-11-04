import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import type { BookingDetail, BookingStatus } from '@/lib/booking/types';
import { artisanPhotoSource } from '@/lib/catalogue/assets';
import { useArtisan } from '@/lib/catalogue/hooks';
import { config } from '@/lib/config';

/** Statuses where an artisan is assigned and on the way to, at, or finishing the job. */
export const WHOS_COMING_STATUSES: BookingStatus[] = ['Accepted', 'OnMyWay', 'Arrived', 'InProgress', 'AwaitingConfirmation'];

/**
 * "Who's coming" (Business Model v1.4, section 15): the artisan appears only once Servika has
 * assigned them. Photo, name, checked badge, jobs done on Servika and three recent work photos.
 * No star average: ratings are collected, not shown.
 */
export function WhosComingCard({ artisanId }: { artisanId: string }) {
  const router = useRouter();
  const { data: artisan, isLoading } = useArtisan(artisanId);
  if (isLoading) {
    return (
      <View className="mt-4 items-center rounded-2xl border border-gray-100 bg-white p-4">
        <ActivityIndicator color={colors.accentDeep} />
      </View>
    );
  }
  if (!artisan) return null;
  const photos = artisan.galleryUrls.slice(0, 3);
  const jobs = artisan.completedJobs ?? 0;
  return (
    <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
      <AppText weight="semibold" className="mb-3 text-[12px] uppercase tracking-wide text-gray-400">
        Who&apos;s coming
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${artisan.fullName}'s profile`}
        onPress={() => router.push({ pathname: '/artisan/[id]', params: { id: artisan.id } })}
        className="flex-row items-center gap-3"
      >
        <Image source={artisanPhotoSource(artisan.photoUrl, artisan.imageKey)} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEE' }} contentFit="cover" />
        <View className="flex-1">
          <AppText weight="semibold" className="text-[16px] text-gray-900">{artisan.fullName}</AppText>
          <AppText className="mt-0.5 text-[13px] text-gray-500">
            {[artisan.specialty, jobs > 0 ? `${jobs} job${jobs === 1 ? '' : 's'} done on Servika` : 'New on Servika'].filter(Boolean).join(' · ')}
          </AppText>
          <View className="mt-1 flex-row items-center gap-1">
            <Ionicons name="shield-checkmark" size={13} color={colors.onlineInk} />
            <AppText className="text-[12px] text-gray-600">ID checked by Servika</AppText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      {photos.length > 0 ? (
        <View className="mt-3 flex-row gap-2">
          {photos.map((u) => (
            <Image key={u} source={{ uri: `${config.apiBaseUrl}${u}` }} style={{ flex: 1, aspectRatio: 1, borderRadius: 12, backgroundColor: '#EEE' }} contentFit="cover" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** The Open state: artisans nearby are sending prices or offers to visit first. */
export function FindingArtisanCard({ booking, offers = 0 }: { booking: BookingDetail; offers?: number }) {
  const stuck = !!booking.offersExhaustedAtUtc && offers === 0;
  return (
    <View className="mt-4 rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: stuck ? '#FFF6E0' : '#FFF1E4' }}>
          {stuck ? (
            <Ionicons name="time-outline" size={20} color="#D9950B" />
          ) : offers > 0 ? (
            <Ionicons name="pricetags-outline" size={19} color={colors.accentDeep} />
          ) : (
            <ActivityIndicator color={colors.accentDeep} />
          )}
        </View>
        <View className="flex-1">
          <AppText weight="semibold" className="text-[15px] text-gray-900">
            {stuck ? 'No artisan free yet' : offers > 0 ? `${offers} ${offers === 1 ? 'artisan has' : 'artisans have'} answered` : 'Getting prices'}
          </AppText>
          <AppText className="mt-0.5 text-[13px] leading-[18px] text-gray-500">
            {stuck
              ? 'Nobody near you is online for this right now. Your job stays open and artisans see it as they come online.'
              : offers > 0
                ? 'Compare their prices and visit offers below. More may still come in.'
                : 'Checked artisans nearby can see your job. Their prices, or offers to visit first, come in here.'}
          </AppText>
        </View>
      </View>
    </View>
  );
}
