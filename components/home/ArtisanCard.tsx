import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { Artisan } from '@/constants/home-data';

export function ArtisanCard({
  artisan,
  onPress,
  onBook,
  onChat,
}: {
  artisan: Artisan;
  onPress?: () => void;
  onBook?: () => void;
  onChat?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${artisan.name}, ${artisan.specialty}`}
      onPress={onPress}
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
      className="w-56 overflow-hidden rounded-2xl border-gray-100 bg-white"
    >
      {/* Image on top, full width */}
      <View className="h-40 w-full bg-background">
        <Image
          source={artisan.avatar}
          contentFit="cover"
          contentPosition="top"
          style={{ flex: 1 }}
        />

        {/* Availability badge floating on the image */}
        <View className="absolute left-2.5 top-2.5 flex-row items-center gap-1 rounded-full bg-white/95 px-2 py-1">
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
                ? 'text-[8px] font-semibold text-green-600'
                : 'text-[8px] font-semibold text-gray-400'
            }
          >
            {artisan.available ? 'Available' : 'Busy'}
          </Text>
        </View>
      </View>

      {/* Details below the image */}
      <View className="px-3 pb-3 pt-2.5">
        {/* Name + verified badge */}
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

        {/* Rating + distance */}
        <View className="mt-2 flex-row items-center gap-3">
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

        {/* Book Now + Chat buttons */}
        <View className="mt-3 flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Book ${artisan.name}`}
            onPress={onBook}
            className="h-10 flex-1 flex-row items-center justify-center rounded-xl bg-primary"
          >
            <Text className="text-[13px] font-bold text-white">Book Now</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${artisan.name} — sign in required`}
            onPress={onChat}
            className="relative h-10 flex-row items-center pr-2 pl-2 gap-1.5  rounded-xl border border-gray-200 bg-white"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={15}
              color={colors.primary}
            />
            <Text className="text-[13px] font-bold text-primary">Chat</Text>

            {/* Locked badge pinned to the top-right corner */}
            <View className="absolute -right-1.5 -top-1.5 h-4 w-4 items-center justify-center rounded-full border border-white bg-gray-400">
              <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
