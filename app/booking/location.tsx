import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
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
  const { service, artisanId, categorySlug, open, description, date, time, urgency, photos } =
    useLocalSearchParams<{
      service?: string;
      artisanId?: string;
      categorySlug?: string;
      open?: string;
      description?: string;
      date?: string;
      time?: string;
      urgency?: string;
      photos?: string;
    }>();

  const [instructions, setInstructions] = useState('');
  const [addressText, setAddressText] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const canConfirm = addressText.trim().length > 0;

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        throw new Error('Location permission denied.');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const formattedAddress = reverseGeocode
        ? [
            reverseGeocode.name,
            reverseGeocode.street,
            reverseGeocode.district,
            reverseGeocode.city,
            reverseGeocode.region,
          ]
            .filter(Boolean)
            .join(', ')
        : `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;

      setAddressText(formattedAddress);
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to retrieve your current location.';
      Alert.alert('Location Error', message);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleConfirm = () => {
    router.push({
      pathname: '/booking/summary',
      params: {
        service,
        artisanId,
        categorySlug,
        open,
        description,
        date,
        time,
        urgency,
        photos,
        instructions,
        addressText,
        ...(coords
          ? { lat: String(coords.lat), lng: String(coords.lng) }
          : {}),
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
          contentContainerStyle={{
            padding: 20,
            paddingTop: 4,
            paddingBottom: 24,
          }}
        >
          {/* Use current location */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Use my current location"
            accessibilityState={{ busy: isLoadingLocation }}
            onPress={handleUseCurrentLocation}
            disabled={isLoadingLocation}
            className="flex-row items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 active:opacity-80"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="locate" size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-primary">
                {isLoadingLocation ? 'Getting your location…' : 'Use my current location'}
              </Text>
              <Text className="mt-0.5 text-[12px] text-gray-500">
                We&apos;ll fill in your address automatically.
              </Text>
            </View>
            {coords ? <Ionicons name="checkmark-circle" size={20} color="#22C55E" /> : null}
          </Pressable>

          {/* Service address (editable) */}
          <View className="mt-4">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">
              Service address
            </Text>
            <TextInput
              value={addressText}
              onChangeText={(t) => {
                setAddressText(t);
                setCoords(null); // typed address no longer matches the GPS fix
              }}
              placeholder="Enter the address the artisan should come to"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              className="min-h-[72px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-900"
            />
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
            <Button label="Confirm Location" disabled={!canConfirm} onPress={handleConfirm} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
