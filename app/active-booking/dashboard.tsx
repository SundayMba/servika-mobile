import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtisanRow, StatusTimeline } from '@/components/active-booking/parts';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { MOCK_ARTISAN, TRACK_STEPS } from '@/lib/active-booking/mock';

function shortRef(id?: string) {
  if (!id) return 'SVK-78D45';
  return `SVK-${id.replace(/-/g, '').slice(0, 5).toUpperCase()}`;
}

export default function ActiveBookingDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    artisanId?: string;
    serviceName?: string;
    artisanName?: string;
  }>();

  const artisanName = params.artisanName || MOCK_ARTISAN.name;
  const serviceName = params.serviceName || 'Electrical Installation';
  const linkParams = {
    id: params.bookingId || 'demo',
    artisanId: params.artisanId,
    name: artisanName,
    serviceName,
  };

  const cancel = () =>
    Alert.alert('Cancel booking?', 'This will withdraw your request.', [
      { text: 'Keep booking', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => router.back() },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <View>
          <Text className="text-[22px] font-bold text-gray-900">
            Active Booking
          </Text>
          <Text className="text-[13px] text-gray-500">
            Track your booking status in real time
          </Text>
        </View>
        <View className="flex-row gap-2">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
      >
        {/* Booking card */}
        <View className="rounded-3xl border border-gray-100 bg-white p-4">
          <View className="flex-row items-start justify-between">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Ionicons name="flash" size={22} color={colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[16px] font-bold text-gray-900">
                {serviceName}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 rounded-full bg-green-100 px-2.5 py-1">
              <Ionicons name="checkmark-circle" size={13} color="#15803D" />
              <Text className="text-[11px] font-bold text-green-700">Accepted</Text>
            </View>
          </View>

          <View className="mt-3 gap-1.5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text className="text-[12px] text-gray-600">
                Mon, 26 May 2025 • 10:00 AM
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text className="text-[12px] text-gray-600">
                12 Admiralty Way, Ikoyi, Lagos
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="receipt-outline" size={14} color={colors.textMuted} />
              <Text className="text-[12px] text-gray-600">
                Booking ID: {shortRef(params.bookingId)}
              </Text>
            </View>
          </View>

          <View className="my-4 h-px bg-gray-100" />

          <ArtisanRow
            name={artisanName}
            specialty={MOCK_ARTISAN.specialty}
            rating={MOCK_ARTISAN.rating}
            jobsCount={MOCK_ARTISAN.jobsCount}
            imageKey={MOCK_ARTISAN.imageKey}
            right={
              <Pressable
                onPress={() => router.push({ pathname: '/chat/[id]', params: linkParams })}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary/10"
              >
                <Ionicons name="call" size={18} color={colors.primary} />
              </Pressable>
            }
          />
        </View>

        {/* Timeline */}
        <View className="mt-4 rounded-3xl border border-gray-100 bg-white p-4">
          <StatusTimeline steps={TRACK_STEPS} current={1} />
          <Text className="mt-2 text-center text-[11px] text-gray-400">
            Accepted • 9:42 AM
          </Text>
        </View>

        {/* Live tracking */}
        <Pressable
          onPress={() => router.push({ pathname: '/active-booking/tracking', params: linkParams })}
          className="mt-4 flex-row items-center rounded-2xl bg-primary/5 p-4 active:opacity-80"
        >
          <Ionicons name="navigate-circle-outline" size={22} color={colors.primary} />
          <View className="ml-3 flex-1">
            <Text className="text-[13px] font-bold text-gray-900">Track your artisan live</Text>
            <Text className="mt-0.5 text-[12px] leading-4 text-gray-600">
              Watch their location on the map once they’re on the way.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>

        {/* Actions */}
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Message"
              onPress={() => router.push({ pathname: '/chat/[id]', params: linkParams })}
            />
          </View>
          <View className="flex-1">
            <Button
              label="View Tracking"
              variant="outline"
              onPress={() =>
                router.push({ pathname: '/active-booking/tracking', params: linkParams })
              }
            />
          </View>
        </View>

        <Pressable onPress={cancel} className="mt-4 flex-row items-center justify-center gap-1.5">
          <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
          <Text className="text-[14px] font-semibold text-red-600">
            Cancel Booking
          </Text>
        </Pressable>

        <Text className="mt-5 text-center text-[11px] text-gray-400">
          🛡 Secure. Trusted. Servika.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
