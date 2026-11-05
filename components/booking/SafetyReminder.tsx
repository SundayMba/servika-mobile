import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import type { BookingStatus } from '@/lib/booking/types';
import { artisanPhotoSource } from '@/lib/catalogue/assets';
import { useArtisan } from '@/lib/catalogue/hooks';

// Dismissed reminders, per booking and status, for this app session only.
const dismissed = new Set<string>();

function reminderText(status: BookingStatus, first: string): string | null {
  switch (status) {
    case 'Accepted':
      return `Before ${first} comes: put valuables away and plan to be home.`;
    case 'OnMyWay':
      return `${first} is on the way. Put cash and small valuables away.`;
    case 'Arrived':
      return `Check it is ${first} from the photo before you open the door.`;
    case 'InProgress':
      return 'Stay around while the work is done. Keep payment in the app.';
    default:
      return null;
  }
}

/**
 * A short home-safety nudge that changes with the booking's status. Hidden for
 * statuses where nobody is coming. Dismissible per booking per status.
 */
export function SafetyReminder({
  bookingId,
  status,
  artisanName,
  artisanId,
  variant = 'card',
}: {
  bookingId: string;
  status: BookingStatus;
  artisanName?: string | null;
  artisanId?: string | null;
  /** "strip" is a slimmer version for the map screen. */
  variant?: 'card' | 'strip';
}) {
  const key = `${bookingId}:${status}`;
  const [hidden, setHidden] = useState(() => dismissed.has(key));
  // Shares the cache with the other artisan reads on the screen.
  const { data: artisan } = useArtisan(status === 'Arrived' ? (artisanId ?? undefined) : undefined);

  const first = artisanName?.trim().split(/\s+/)[0] || 'your artisan';
  const text = reminderText(status, first);
  if (!text || hidden || dismissed.has(key)) return null;

  const dismiss = () => {
    dismissed.add(key);
    setHidden(true);
  };

  const photo = status === 'Arrived' && artisan ? artisanPhotoSource(artisan.photoUrl, artisan.imageKey) : undefined;
  const strip = variant === 'strip';
  const iconSize = strip ? 16 : 18;

  return (
    <View
      accessibilityRole="summary"
      className={`flex-row items-center rounded-2xl border border-gray-100 ${strip ? 'px-3 py-2' : 'mt-4 p-3.5'}`}
      style={{ backgroundColor: strip ? '#FFFFFF' : colors.sand }}
    >
      {photo ? (
        <Image
          source={photo}
          style={{ width: strip ? 28 : 36, height: strip ? 28 : 36, borderRadius: strip ? 14 : 18, backgroundColor: '#EEE' }}
          contentFit="cover"
        />
      ) : (
        <View
          className={`items-center justify-center rounded-full bg-primary/10 ${strip ? 'h-7 w-7' : 'h-9 w-9'}`}
        >
          <Ionicons name="shield-outline" size={iconSize} color={colors.primary} />
        </View>
      )}
      <AppText className={`ml-3 flex-1 text-gray-700 ${strip ? 'text-[12px] leading-4' : 'text-[13px] leading-[18px]'}`}>
        {text}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Hide this reminder"
        hitSlop={10}
        onPress={dismiss}
        className="ml-2 h-7 w-7 items-center justify-center"
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}
