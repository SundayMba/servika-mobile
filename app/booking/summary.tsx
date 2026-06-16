import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingSteps } from '@/components/booking/BookingSteps';
import { colors } from '@/constants/colors';

// Placeholder — the full "Booking Summary" screen is the next chunk. Exists
// now so "Confirm Location" advances cleanly.
export default function BookingSummary() {
  const router = useRouter();
  const { service } = useLocalSearchParams<{ service?: string }>();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      <View className="flex-row items-center justify-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View className="items-center">
          <Text className="text-[17px] font-bold text-gray-900">
            Booking Summary
          </Text>
          <Text className="text-[12px] text-gray-500">
            {service ?? 'Service Request'}
          </Text>
        </View>
      </View>

      <View className="px-5 py-4">
        <BookingSteps current={3} />
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-[16px] font-semibold text-gray-900">
          Booking Summary
        </Text>
        <Text className="mt-2 text-center text-[14px] text-gray-500">
          Summary & payment coming next.
        </Text>
      </View>
    </SafeAreaView>
  );
}
