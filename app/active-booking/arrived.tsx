import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArtisanRow,
  MapPlaceholder,
  VerifiedBadges,
} from '@/components/active-booking/parts';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { MOCK_ARTISAN } from '@/lib/active-booking/mock';

export default function ArtisanArrived() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; serviceName?: string }>();
  const name = params.name || MOCK_ARTISAN.name;
  const linkParams = { id: params.id || 'demo', name, serviceName: params.serviceName };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <StatusBar style="dark" />

      {/* Top bar */}
      <View className="flex-row items-center justify-between px-5 py-2">
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text className="text-[16px] font-extrabold text-gray-900">SERVIKA</Text>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textPrimary} />
        </View>
      </View>

      <View className="flex-1">
        <View
          style={{ elevation: 4 }}
          className="absolute left-5 right-5 top-3 z-10 flex-row items-center rounded-2xl bg-white p-3.5"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="checkmark" size={20} color="#15803D" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[15px] font-bold text-gray-900">
              Artisan has arrived
            </Text>
            <Text className="text-[12px] text-gray-500">
              Your artisan is at the location
            </Text>
          </View>
        </View>
        <MapPlaceholder imageKey={MOCK_ARTISAN.imageKey} arrived />
      </View>

      <View className="rounded-t-3xl bg-white px-5 pb-6 pt-5" style={{ elevation: 8 }}>
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="checkmark-circle" size={22} color="#15803D" />
          </View>
          <View className="ml-3">
            <Text className="text-[16px] font-bold text-gray-900">
              {name.split(' ')[0]} has arrived!
            </Text>
            <Text className="text-[12px] text-gray-500">
              Your artisan is on site and ready to start.
            </Text>
          </View>
        </View>

        <View className="my-4 h-px bg-gray-100" />

        <ArtisanRow
          name={name}
          specialty={MOCK_ARTISAN.specialty}
          rating={MOCK_ARTISAN.rating}
          jobsCount={MOCK_ARTISAN.jobsCount}
          imageKey={MOCK_ARTISAN.imageKey}
        />
        <View className="mt-3">
          <VerifiedBadges />
        </View>

        <View className="mt-5">
          <Button
            label="Start Job"
            onPress={() =>
              router.push({ pathname: '/active-booking/in-progress', params: linkParams })
            }
          />
        </View>
        <View className="mt-3 flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Open Chat"
              variant="outline"
              onPress={() => router.push({ pathname: '/chat/[id]', params: { id: linkParams.id, name } })}
            />
          </View>
          <View className="flex-1">
            <Button label="Call" variant="outline" onPress={() => {}} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
