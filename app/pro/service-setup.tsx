import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProHeader } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { ARTISAN_SERVICES, formatNaira } from '@/lib/artisan/mock';
import { categoryImage } from '@/lib/catalogue/assets';

export default function ServiceSetup() {
  // Toggles are local-only in this batch (no backend).
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(ARTISAN_SERVICES.map((s) => [s.id, s.enabled])),
  );
  const activeCount = Object.values(enabled).filter(Boolean).length;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ProHeader
        title="My Services"
        right={
          <Pressable accessibilityRole="button" hitSlop={8} className="flex-row items-center gap-1">
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text className="text-[14px] font-semibold text-primary">Add Service</Text>
          </Pressable>
        }
      />

      <View className="border-b border-gray-100 px-5 pb-2">
        <Text className="text-[13px] text-gray-500">All Services ({activeCount} active)</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
      >
        {ARTISAN_SERVICES.map((s) => {
          const img = categoryImage(s.imageKey);
          const on = enabled[s.id];
          return (
            <View
              key={s.id}
              className="mb-3 flex-row items-center rounded-2xl border border-gray-100 bg-white p-3"
            >
              {img ? (
                <Image source={img} style={{ width: 48, height: 48, borderRadius: 12 }} contentFit="cover" />
              ) : (
                <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Ionicons name="construct" size={20} color={colors.primary} />
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-semibold text-gray-900">{s.name}</Text>
                <Text className="text-[12px] text-gray-500">{s.subtitle}</Text>
                <Text className="text-[13px] font-bold text-gray-900">{formatNaira(s.priceNaira)}</Text>
              </View>
              <Switch
                value={on}
                onValueChange={(v) => setEnabled((prev) => ({ ...prev, [s.id]: v }))}
                trackColor={{ true: colors.primary, false: '#D1D5DB' }}
                thumbColor={colors.white}
              />
            </View>
          );
        })}

        {/* Boost banner */}
        <View className="mt-2 flex-row items-center rounded-2xl bg-primary/[0.07] p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/15">
            <Ionicons name="rocket-outline" size={20} color={colors.primary} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[14px] font-bold text-gray-900">Boost your visibility</Text>
            <Text className="text-[12px] text-gray-500">Get more bookings by boosting your services.</Text>
          </View>
          <Pressable accessibilityRole="button" className="rounded-full bg-primary px-4 py-2 active:opacity-80">
            <Text className="text-[13px] font-bold text-white">Boost</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
