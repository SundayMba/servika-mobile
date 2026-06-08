import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { Artisan } from '@/constants/home-data';

export function ArtisanCard({
  artisan,
  onPress,
}: {
  artisan: Artisan;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${artisan.name}, ${artisan.specialty}`}
      onPress={onPress}
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.01,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
      className="h-40 w-72 flex-row overflow-hidden rounded-2xl border border-gray-100 bg-white p-2"
    >
      {/* Full-height image on the left, inset with a small padding */}
      <View className="h-full w-24 overflow-hidden rounded-xl bg-background">
        <Image source={artisan.avatar} contentFit="cover" style={{ flex: 1 }} />
      </View>

      {/* Full-height info column on the right */}
      <View className="flex-1 justify-between px-3 py-1.5">
        {/* Name, specialty and rating evenly spaced in the upper area */}
        <View className="flex-1 justify-evenly">
          {/* Identity */}
          <View>
            <View className="flex-row items-center gap-1">
              <Text
                numberOfLines={1}
                className="flex-shrink text-[15px] font-semibold text-gray-900"
              >
                {artisan.name}
              </Text>
              <MaterialCommunityIcons
                name="check-decagram"
                size={15}
                color="#3B82F6"
              />
            </View>
            <Text
              numberOfLines={1}
              className="mt-0.5 text-xs font-medium text-primary"
            >
              {artisan.specialty}
            </Text>
          </View>

          {/* Rating + distance */}
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={13} color="#FBBF24" />
              <Text className="text-xs font-semibold text-gray-700">
                {artisan.rating.toFixed(1)}
              </Text>
            </View>
            <View className="flex-row items-center gap-0.5">
              <Ionicons
                name="location-outline"
                size={13}
                color={colors.textMuted}
              />
              <Text className="text-xs text-gray-500">
                {artisan.distanceKm} km
              </Text>
            </View>
          </View>
        </View>

        {/* Availability pinned to the bottom */}
        <View className="flex-row items-center gap-1">
          <View
            className={
              artisan.available
                ? 'h-1.5 w-1.5 rounded-full bg-green-500'
                : 'h-1.5 w-1.5 rounded-full bg-gray-300'
            }
          />
          <Text
            className={
              artisan.available
                ? 'text-[11px] font-medium text-green-600'
                : 'text-[11px] font-medium text-gray-400'
            }
          >
            {artisan.available ? 'Available' : 'Busy'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
