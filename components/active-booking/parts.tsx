import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { colors } from '@/constants/colors';
import { artisanPhotoSource } from '@/lib/catalogue/assets';

/**
 * Stylised map placeholder for the tracking screens. There's no map SDK yet
 * (real maps + live position arrive with the SignalR slice), so this draws a
 * pleasant abstract street map with an orange route, a destination pin and the
 * artisan's avatar marker. Fills its parent — wrap it in a sized container.
 */
export function MapPlaceholder({
  imageKey,
  photoUrl,
  arrived = false,
}: {
  imageKey: string;
  photoUrl?: string | null;
  arrived?: boolean;
}) {
  const avatar = artisanPhotoSource(photoUrl, imageKey);
  return (
    <View className="flex-1 overflow-hidden">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Rect x="0" y="0" width="100" height="100" fill="#E9EEF4" />
        {/* parks */}
        <Rect x="2" y="4" width="26" height="20" rx="3" fill="#DBEBD8" />
        <Rect x="70" y="60" width="34" height="30" rx="3" fill="#DBEBD8" />
        {/* streets */}
        <Line x1="0" y1="35" x2="100" y2="30" stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="0" y1="68" x2="100" y2="72" stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="30" y1="0" x2="34" y2="100" stroke="#FFFFFF" strokeWidth="6" />
        <Line x1="74" y1="0" x2="70" y2="100" stroke="#FFFFFF" strokeWidth="6" />
        {/* route */}
        <Path
          d="M48 80 C40 64 64 58 55 44 C50 36 52 34 54 28"
          stroke={colors.primary}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx="48" cy="80" r="2.6" fill={colors.primary} />
      </Svg>

      {/* destination pin */}
      <View style={{ position: 'absolute', left: '44%', top: '70%' }}>
        <Ionicons name="location" size={26} color={colors.primary} />
      </View>

      {/* artisan marker */}
      <View
        style={{ position: 'absolute', left: '49%', top: '20%' }}
        className="items-center"
      >
        <View className="rounded-full border-2 border-white bg-white" style={{ elevation: 4 }}>
          {avatar ? (
            <Image
              source={avatar}
              style={{ width: 34, height: 34, borderRadius: 17 }}
              contentFit="cover"
            />
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/15">
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
          )}
        </View>
      </View>

      {/* recenter */}
      <View
        className="absolute bottom-3 right-3 h-10 w-10 items-center justify-center rounded-full bg-white"
        style={{ elevation: 3 }}
      >
        <Ionicons
          name={arrived ? 'checkmark' : 'navigate'}
          size={18}
          color={colors.primary}
        />
      </View>
    </View>
  );
}

/** Horizontal step tracker. `current` is the index of the in-progress step. */
export function StatusTimeline({
  steps,
  current,
}: {
  steps: readonly string[];
  current: number;
}) {
  return (
    <View className="flex-row">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const reached = done || active;
        return (
          <View key={label} className="flex-1 items-center">
            <View className="w-full flex-row items-center">
              <View
                className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : done || active ? 'bg-primary' : 'bg-gray-200'}`}
              />
              <View
                className={
                  reached
                    ? 'h-5 w-5 items-center justify-center rounded-full bg-primary'
                    : 'h-5 w-5 items-center justify-center rounded-full border-2 border-gray-200 bg-white'
                }
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                ) : active ? (
                  <View className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </View>
              <View
                className={`h-0.5 flex-1 ${i === steps.length - 1 ? 'opacity-0' : done ? 'bg-primary' : 'bg-gray-200'}`}
              />
            </View>
            <Text
              className={`mt-1.5 text-center text-[9px] ${reached ? 'font-semibold text-gray-700' : 'text-gray-400'}`}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** Artisan identity row used on tracking / arrived / completion cards. */
export function ArtisanRow({
  name,
  specialty,
  rating,
  jobsCount,
  imageKey,
  photoUrl,
  right,
}: {
  name: string;
  specialty: string;
  rating: number;
  jobsCount: string;
  imageKey: string;
  photoUrl?: string | null;
  right?: React.ReactNode;
}) {
  const avatar = artisanPhotoSource(photoUrl, imageKey);
  return (
    <View className="flex-row items-center">
      {avatar ? (
        <Image
          source={avatar}
          style={{ width: 52, height: 52, borderRadius: 26 }}
          contentFit="cover"
        />
      ) : (
        <View className="h-13 w-13 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text className="text-[15px] font-bold text-gray-900">{name}</Text>
        <Text className="text-[12px] text-primary">{specialty}</Text>
        <View className="mt-0.5 flex-row items-center gap-1">
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text className="text-[12px] text-gray-500">
            {rating.toFixed(1)} · {jobsCount} jobs completed
          </Text>
        </View>
      </View>
      {right}
    </View>
  );
}

/** Trust pills: background-checked / ID-verified / insured. */
export function VerifiedBadges() {
  const items = [
    { icon: 'shield-checkmark', label: 'Background checked' },
    { icon: 'card', label: 'ID verified' },
    { icon: 'umbrella', label: 'Insured' },
  ] as const;
  return (
    <View className="flex-row flex-wrap gap-x-3 gap-y-1">
      {items.map((it) => (
        <View key={it.label} className="flex-row items-center gap-1">
          <Ionicons name={it.icon} size={12} color={colors.primary} />
          <Text className="text-[11px] text-gray-500">{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
