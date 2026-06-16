import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookingSteps } from '@/components/booking/BookingSteps';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';

export default function BookingLocation() {
  const router = useRouter();
  const { service } = useLocalSearchParams<{ service?: string }>();

  const [instructions, setInstructions] = useState('');

  const handleConfirm = () => {
    router.push({ pathname: '/booking/summary', params: { service } });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
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
            Confirm Location
          </Text>
          <Text className="text-[12px] text-gray-500">
            Where should we send the artisan?
          </Text>
        </View>
      </View>

      {/* Steps */}
      <View className="px-5 py-4">
        <BookingSteps current={2} />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 24 }}
        >
          {/* Map placeholder */}
          <View className="h-56 overflow-hidden rounded-2xl border border-gray-100 bg-gray-100">
            <View className="flex-1 items-center justify-center">
              <Ionicons name="location" size={44} color={colors.primary} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use my current location"
              style={{
                shadowColor: '#0F172A',
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
              className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="locate" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {/* Saved address */}
          <View className="mt-4 flex-row items-center rounded-2xl border border-gray-100 bg-white p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="home-outline" size={18} color={colors.primary} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[14px] font-bold text-gray-900">Home</Text>
              <Text className="mt-0.5 text-[12px] leading-4 text-gray-500">
                12 Admiralty Way, Lekki Phase 1, Lagos, Nigeria
              </Text>
            </View>
            <Pressable hitSlop={8}>
              <Text className="text-[13px] font-semibold text-primary">Change</Text>
            </Pressable>
          </View>

          {/* Delivery instructions */}
          <View className="mt-5">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">
              Add delivery instructions (optional)
            </Text>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              placeholder="e.g. Gate code, floor number, landmark"
              placeholderTextColor={colors.textMuted}
              className="h-14 rounded-2xl border border-gray-200 bg-white px-4 text-[15px] text-gray-900"
            />
          </View>

          {/* Confirm */}
          <View className="mt-7">
            <Button label="Confirm Location" onPress={handleConfirm} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
