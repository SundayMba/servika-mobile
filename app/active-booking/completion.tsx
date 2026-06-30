import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArtisanRow } from '@/components/active-booking/parts';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { MOCK_ARTISAN } from '@/lib/active-booking/mock';

const FACES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'sad-outline', label: 'Very Bad' },
  { icon: 'sad-outline', label: 'Bad' },
  { icon: 'remove-circle-outline', label: 'Neutral' },
  { icon: 'happy-outline', label: 'Satisfied' },
  { icon: 'happy-outline', label: 'Excellent' },
];

export default function ServiceCompletion() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; name?: string; serviceName?: string }>();
  const name = params.name || MOCK_ARTISAN.name;
  const serviceName = params.serviceName || 'Electrical Installation & Repair';
  const [rating, setRating] = useState(3); // 0-indexed → "Satisfied"

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      <View className="flex-row items-center px-5 py-2">
        <Pressable
          hitSlop={8}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
      >
        <View className="items-center">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-green-500">
            <Ionicons name="checkmark" size={42} color={colors.white} />
          </View>
          <Text className="mt-4 text-[22px] font-bold text-gray-900">
            Service Completed!
          </Text>
          <Text className="mt-1 text-center text-[13px] text-gray-500">
            Thanks for choosing Servika. We hope you’re happy with the service.
          </Text>
        </View>

        {/* Receipt */}
        <View className="mt-6 rounded-3xl border border-gray-100 bg-white p-4">
          <ArtisanRow
            name={name}
            specialty={MOCK_ARTISAN.specialty}
            rating={MOCK_ARTISAN.rating}
            jobsCount={MOCK_ARTISAN.jobsCount}
            imageKey={MOCK_ARTISAN.imageKey}
          />
          <View className="my-3 h-px bg-gray-100" />
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-[13px] text-gray-500">Completed on</Text>
            <Text className="text-[13px] font-medium text-gray-900">
              24 May 2025 • 11:35 AM
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-[13px] text-gray-500">Service</Text>
            <Text className="ml-4 flex-1 text-right text-[13px] font-medium text-gray-900">
              {serviceName}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-[13px] text-gray-500">Amount paid</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-[13px] font-bold text-gray-900">₦18,750.00</Text>
              <View className="rounded-full bg-green-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-green-700">Paid</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Satisfaction */}
        <View className="mt-5">
          <Text className="text-center text-[14px] font-bold text-gray-900">
            How satisfied are you with the service?
          </Text>
          <View className="mt-3 flex-row justify-between">
            {FACES.map((f, i) => {
              const selected = rating === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => setRating(i)}
                  className="items-center"
                  style={{ width: '19%' }}
                >
                  <View
                    className={
                      selected
                        ? 'h-12 w-12 items-center justify-center rounded-full bg-primary'
                        : 'h-12 w-12 items-center justify-center rounded-full bg-gray-100'
                    }
                  >
                    <Ionicons
                      name={f.icon}
                      size={22}
                      color={selected ? colors.white : colors.textMuted}
                    />
                  </View>
                  <Text
                    className={`mt-1 text-center text-[9px] ${selected ? 'font-bold text-primary' : 'text-gray-400'}`}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-5 flex-row items-center rounded-2xl bg-primary/5 p-3">
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text className="ml-2 flex-1 text-[12px] text-gray-600">
            Confirming completion will finalize this service and release payment to
            the artisan.
          </Text>
        </View>

        <View className="mt-5">
          <Button
            label="Confirm Completed"
            onPress={() =>
              router.replace({
                pathname: '/review',
                params: { id: params.id || 'demo', name, serviceName },
              })
            }
          />
        </View>
        <Pressable
          onPress={() => router.push('/report-issue')}
          className="mt-4 flex-row items-center justify-center gap-1.5"
        >
          <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text className="text-[14px] font-semibold text-red-600">Raise an Issue</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
