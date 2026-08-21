import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { appAlert } from '@/components/ui/AppAlert';
import { PhotoViewer } from '@/components/PhotoViewer';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { useCompleteBooking, useJobCompletion } from '@/lib/booking/hooks';
import { artisanPhotoSource } from '@/lib/catalogue/assets';
import { useArtisan } from '@/lib/catalogue/hooks';

/**
 * Customer reviews the artisan's proof-of-work and confirms completion. Shows the
 * submitted photos + note; "Confirm & Rate" closes the job (→ Completed) and goes
 * to the review screen. If the job already auto-confirmed, it just leads to the
 * review. "Raise an issue" routes to the (scaffolded) dispute flow.
 */
export default function ServiceCompletion() {
  // Fullscreen zoomable viewer for the proof photos (null = closed).
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    artisanId?: string;
    name?: string;
    serviceName?: string;
  }>();

  const bookingId = params.id && params.id !== 'demo' ? params.id : undefined;
  const { data: artisan } = useArtisan(params.artisanId);
  const { data: completion, isLoading } = useJobCompletion(bookingId);
  const complete = useCompleteBooking();

  const name = artisan?.fullName || params.name || 'Your artisan';
  const specialty = artisan?.specialty || 'Artisan';
  const serviceName = params.serviceName || 'your job';
  const avatar = artisanPhotoSource(artisan?.photoUrl, artisan?.imageKey);
  const alreadyCompleted = completion?.status === 'Completed';

  const goRate = () =>
    router.replace({
      pathname: '/review',
      params: {
        bookingId: bookingId ?? '',
        artisanId: params.artisanId,
        name,
        serviceName,
      },
    });

  const onConfirm = async () => {
    if (!bookingId) return goRate();
    if (alreadyCompleted) return goRate();
    try {
      await complete.mutateAsync(bookingId);
      goRate();
    } catch (e) {
      appAlert('Could not confirm', authErrorMessage(e, 'Please try again.'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-center px-5 py-2">
        <Pressable
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <AppText weight="semibold" className="text-[17px] text-gray-900">Confirm completion</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
      >
        {/* Artisan */}
        <View className="flex-row items-center rounded-3xl border border-gray-100 bg-white p-4">
          <View className="h-14 w-14 overflow-hidden rounded-full bg-background">
            {avatar ? (
              <Image source={avatar} style={{ flex: 1 }} contentFit="cover" contentPosition="top" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="person" size={24} color={colors.textMuted} />
              </View>
            )}
          </View>
          <View className="ml-3 flex-1">
            <AppText weight="semibold" className="text-[16px] text-gray-900">{name}</AppText>
            <AppText className="text-[13px] text-gray-500">{specialty}</AppText>
          </View>
          <View className="rounded-full bg-orange-100 px-2.5 py-1">
            <AppText weight="semibold" className="text-[11px] text-orange-700">
              {alreadyCompleted ? 'Completed' : 'Finished the job'}
            </AppText>
          </View>
        </View>

        {/* Proof of work */}
        <AppText weight="semibold" className="mb-2 mt-6 text-[15px] text-gray-900">
          Proof of work
        </AppText>
        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (completion?.photos.length ?? 0) === 0 ? (
          <View className="rounded-2xl border border-gray-100 bg-white p-5">
            <AppText className="text-center text-[13px] text-gray-400">
              No photos were attached.
            </AppText>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {completion!.photos.map((uri, i) => (
              <Pressable
                key={i}
                accessibilityRole="imagebutton"
                accessibilityLabel="View photo fullscreen"
                style={{ width: '47%' }}
                onPress={() => setViewerIndex(i)}
              >
                <Image
                  source={{ uri }}
                  style={{ width: '100%', height: 150, borderRadius: 16 }}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </View>
        )}

        {completion?.note ? (
          <View className="mt-3 rounded-2xl border border-gray-100 bg-white p-4">
            <AppText weight="semibold" className="text-[12px] text-gray-400">NOTE FROM ARTISAN</AppText>
            <AppText className="mt-1 text-[14px] leading-5 text-gray-700">{completion.note}</AppText>
          </View>
        ) : null}

        <View className="mt-5 flex-row items-start gap-2 rounded-2xl bg-primary/5 p-3.5">
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <AppText className="flex-1 text-[12px] leading-4 text-gray-600">
            Confirming finalises the job and lets you rate {name.split(' ')[0]}. If
            you don’t confirm within 48 hours, it confirms automatically.
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={complete.isPending}
          onPress={onConfirm}
          className="mt-5 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          style={complete.isPending ? { opacity: 0.6 } : undefined}
        >
          <AppText weight="semibold" className="text-[15px] text-white">
            {complete.isPending
              ? 'Confirming…'
              : alreadyCompleted
                ? 'Rate the artisan'
                : 'Confirm & Rate'}
          </AppText>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/report-issue',
              params: bookingId ? { bookingId } : {},
            })
          }
          className="mt-4 flex-row items-center justify-center gap-1.5"
        >
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <AppText weight="semibold" className="text-[14px] text-red-600">Raise an issue</AppText>
        </Pressable>
      </ScrollView>
      {/* Zoomable fullscreen viewer for the artisan's proof photos */}
      <PhotoViewer
        visible={viewerIndex !== null}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        photos={(completion?.photos ?? []).map((uri) => ({ uri }))}
      />

    </SafeAreaView>
  );
}
