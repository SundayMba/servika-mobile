import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
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
      Alert.alert('Could not confirm', authErrorMessage(e, 'Please try again.'));
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
        <Text className="text-[17px] font-bold text-gray-900">Confirm completion</Text>
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
            <Text className="text-[16px] font-bold text-gray-900">{name}</Text>
            <Text className="text-[13px] text-gray-500">{specialty}</Text>
          </View>
          <View className="rounded-full bg-orange-100 px-2.5 py-1">
            <Text className="text-[11px] font-bold text-orange-700">
              {alreadyCompleted ? 'Completed' : 'Finished the job'}
            </Text>
          </View>
        </View>

        {/* Proof of work */}
        <Text className="mb-2 mt-6 text-[15px] font-bold text-gray-900">
          Proof of work
        </Text>
        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (completion?.photos.length ?? 0) === 0 ? (
          <View className="rounded-2xl border border-gray-100 bg-white p-5">
            <Text className="text-center text-[13px] text-gray-400">
              No photos were attached.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {completion!.photos.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: '47%', height: 150, borderRadius: 16 }}
                contentFit="cover"
              />
            ))}
          </View>
        )}

        {completion?.note ? (
          <View className="mt-3 rounded-2xl border border-gray-100 bg-white p-4">
            <Text className="text-[12px] font-semibold text-gray-400">NOTE FROM ARTISAN</Text>
            <Text className="mt-1 text-[14px] leading-5 text-gray-700">{completion.note}</Text>
          </View>
        ) : null}

        <View className="mt-5 flex-row items-start gap-2 rounded-2xl bg-primary/5 p-3.5">
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text className="flex-1 text-[12px] leading-4 text-gray-600">
            Confirming finalises the job and lets you rate {name.split(' ')[0]}. If
            you don’t confirm within 48 hours, it confirms automatically.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={complete.isPending}
          onPress={onConfirm}
          className="mt-5 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          style={complete.isPending ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-[15px] font-bold text-white">
            {complete.isPending
              ? 'Confirming…'
              : alreadyCompleted
                ? 'Rate the artisan'
                : 'Confirm & Rate'}
          </Text>
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
          <Text className="text-[14px] font-semibold text-red-600">Raise an issue</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
