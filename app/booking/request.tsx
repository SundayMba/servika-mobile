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

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">
      {children}
    </Text>
  );
}

/** A read-only field that looks like a dropdown / picker trigger. */
function SelectField({
  value,
  placeholder,
  icon = 'chevron-down',
  onPress,
}: {
  value?: string;
  placeholder: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-14 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4"
    >
      <Text
        className={
          value ? 'text-[15px] text-gray-900' : 'text-[15px] text-gray-400'
        }
      >
        {value ?? placeholder}
      </Text>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function UrgencyOption({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={
        selected
          ? 'flex-1 rounded-2xl border-2 border-primary bg-primary/5 p-3.5'
          : 'flex-1 rounded-2xl border border-gray-200 bg-white p-3.5'
      }
    >
      <View className="flex-row items-center gap-2">
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={18}
          color={selected ? colors.primary : colors.textMuted}
        />
        <Text className="text-[14px] font-semibold text-gray-900">{title}</Text>
      </View>
      <Text className="mt-1 text-[12px] text-gray-500">{subtitle}</Text>
    </Pressable>
  );
}

export default function BookingRequest() {
  const router = useRouter();
  const { service } = useLocalSearchParams<{ service?: string }>();

  const [description, setDescription] = useState('');
  const [date, setDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [urgency, setUrgency] = useState<'standard' | 'urgent'>('standard');

  const serviceName = service ?? 'Service Request';

  const handleContinue = () => {
    router.push({
      pathname: '/booking/location',
      params: {
        service: serviceName,
        description,
        date,
        time,
        urgency,
      },
    });
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
            Request Service
          </Text>
          <Text className="text-[12px] text-gray-500">{serviceName}</Text>
        </View>
      </View>

      {/* Steps */}
      <View className="px-5 py-4">
        <BookingSteps current={1} />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingTop: 4,
            paddingBottom: 24,
          }}
        >
          {/* Service needed */}
          <FieldLabel>Service needed</FieldLabel>
          <SelectField value={serviceName} placeholder="Select a service" />

          {/* Describe the job */}
          <View className="mt-4">
            <FieldLabel>Describe the job</FieldLabel>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Tell the artisan what you need done..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              className="min-h-[96px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
            />
          </View>

          {/* Preferred date */}
          <View className="mt-4">
            <FieldLabel>Preferred date</FieldLabel>
            <SelectField
              value={date}
              placeholder="Select date"
              icon="calendar-outline"
              onPress={() => setDate('May 25, 2025')}
            />
          </View>

          {/* Preferred time */}
          <View className="mt-4">
            <FieldLabel>Preferred time</FieldLabel>
            <SelectField
              value={time}
              placeholder="Select time"
              onPress={() => setTime('Morning (8am - 12pm)')}
            />
          </View>

          {/* Urgency */}
          <View className="mt-4">
            <FieldLabel>Urgency</FieldLabel>
            <View className="flex-row gap-3">
              <UrgencyOption
                title="Standard"
                subtitle="Within 24-48h"
                selected={urgency === 'standard'}
                onPress={() => setUrgency('standard')}
              />
              <UrgencyOption
                title="Urgent"
                subtitle="Within 2-4h"
                selected={urgency === 'urgent'}
                onPress={() => setUrgency('urgent')}
              />
            </View>
          </View>

          {/* Continue */}
          <View className="mt-7">
            <Button label="Continue" onPress={handleContinue} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
