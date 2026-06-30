import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';

type IconName = keyof typeof Ionicons.glyphMap;

type TabMeta = { label: string; icon: IconName; iconActive: IconName };

/**
 * Artisan bottom tabs: Dashboard, Jobs, Earnings, Profile. A flat four-tab bar
 * (no raised center button — that's the customer app's convention), re-skinned
 * to the orange brand.
 */
const TABS: Record<string, TabMeta> = {
  dashboard: { label: 'Dashboard', icon: 'home-outline', iconActive: 'home' },
  jobs: { label: 'Jobs', icon: 'briefcase-outline', iconActive: 'briefcase' },
  earnings: { label: 'Earnings', icon: 'wallet-outline', iconActive: 'wallet' },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

export function ArtisanTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingBottom: Math.max(insets.bottom, 12),
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 16,
      }}
      className="absolute inset-x-0 bottom-0 flex-row items-end justify-around rounded-t-[28px] bg-white px-3 pt-2.5"
    >
      {state.routes.map((route, index) => {
        const meta = TABS[route.name];
        if (!meta) return null;

        const isFocused = state.index === index;
        const color = isFocused ? colors.primary : colors.textMuted;

        const onPress = () => {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={meta.label}
            onPress={onPress}
            className="flex-1 items-center justify-end gap-1 pb-1 pt-1"
          >
            <Ionicons name={isFocused ? meta.iconActive : meta.icon} size={24} color={color} />
            <Text
              style={{ color }}
              className={isFocused ? 'text-[11px] font-semibold' : 'text-[11px] font-medium'}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
