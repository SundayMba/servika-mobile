import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuthGate } from '@/lib/auth/useAuthGate';
import { usePastArtisans } from '@/lib/booking/hooks';
import type { PastArtisan } from '@/lib/booking/types';
import { artisanPhotoSource } from '@/lib/catalogue/assets';
import { formatDate } from '@/lib/booking/display';

/** Every artisan this customer has completed a job with, most recent first. */
export default function PastArtisans() {
  const router = useRouter();
  const { data, isLoading } = usePastArtisans();
  const { guard, promptVisible, hidePrompt, onSignedIn } = useAuthGate();
  const book = (a: PastArtisan) =>
    guard(() => router.push({ pathname: '/booking/request', params: { service: a.specialty, artisanId: a.artisanId, rebook: '1' } }));

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <StatusBar style="dark" />
      <View className="flex-row items-center gap-3 px-5 pt-2">
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/bookings'))} className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <AppText weight="semibold" className="text-[18px] text-gray-900">Artisans you&apos;ve booked</AppText>
      </View>
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={colors.accentDeep} /></View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(a) => a.artisanId}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          ListEmptyComponent={
            <View className="items-center px-6 pt-16">
              <AppText weight="semibold" className="text-[16px] text-gray-900">Nobody yet</AppText>
              <AppText className="mt-1 text-center text-[13px] leading-[18px] text-gray-500">Artisans who complete a job for you appear here, so you can book them again in one tap.</AppText>
            </View>
          }
          renderItem={({ item: a }) => (
            <View className="rounded-2xl border border-gray-100 bg-white p-4">
              <View className="flex-row items-center gap-3">
                <Image source={artisanPhotoSource(a.photoUrl, a.imageKey)} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEE' }} contentFit="cover" />
                <View className="flex-1">
                  <AppText weight="semibold" className="text-[15px] text-gray-900">{a.fullName}</AppText>
                  <AppText className="text-[12.5px] text-gray-500">{a.specialty} · {a.jobsWithYou} job{a.jobsWithYou === 1 ? '' : 's'} with you · last {formatDate(a.lastBookedAtUtc)}</AppText>
                </View>
              </View>
              {a.canBook ? (
                <Pressable accessibilityRole="button" onPress={() => book(a)} className="mt-3 h-11 items-center justify-center rounded-xl bg-gray-900">
                  <AppText weight="semibold" className="text-[14px] text-white">{a.isAway ? 'Book again (away now)' : 'Book again'}</AppText>
                </Pressable>
              ) : (
                <AppText className="mt-3 text-[12.5px] text-gray-400">No longer taking bookings on Servika.</AppText>
              )}
            </View>
          )}
        />
      )}
      <AuthPromptSheet visible={promptVisible} onClose={hidePrompt} onSignedIn={onSignedIn} reason="book" />
    </SafeAreaView>
  );
}
