import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useChatUnreadCount } from '@/lib/chat/hooks';

type IconName = keyof typeof Ionicons.glyphMap;

type TabMeta = {
  label: string;
  icon: IconName;
  iconActive: IconName;
  /** Render a small notification dot over the icon. */
  badge?: boolean;
};

/**
 * Per-route presentation for the bottom tab bar. Keyed by the route name
 * (the file name inside app/(tabs)). The `explore` route — the Uber-style
 * nearby-artisans map — is rendered as the raised center button rather than
 * a normal tab. (Categories moved to a plain stack screen at /categories.)
 */
const TABS: Record<string, TabMeta> = {
  home: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  bookings: { label: 'Bookings', icon: 'calendar-outline', iconActive: 'calendar' },
  explore: { label: 'Explore', icon: 'map-outline', iconActive: 'map' },
  messages: {
    label: 'Messages',
    icon: 'chatbubble-ellipses-outline',
    iconActive: 'chatbubble-ellipses',
    badge: true,
  },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

type TabBarProps = BottomTabBarProps & {
  /** Returns true if a route requires the user to be signed in. */
  isProtected?: (routeName: string) => boolean;
  /** Called when a guest taps a protected tab (instead of navigating). */
  onBlockedPress?: () => void;
};

export function TabBar({
  state,
  navigation,
  isProtected,
  onBlockedPress,
}: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { status } = useAuth();
  const { data: unreadMessages } = useChatUnreadCount({
    enabled: status === 'authenticated',
  });
  const hasUnread = (unreadMessages ?? 0) > 0;

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

        const onPress = () => {
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
          }
          // Guests can't open protected tabs — surface the auth prompt instead.
          if (isProtected?.(route.name)) {
            onBlockedPress?.();
            return;
          }
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // The center "Explore" (map) tab renders as a raised circular button.
        if (route.name === 'explore') {
          return (
            <CenterButton
              key={route.key}
              meta={meta}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        }

        const color = isFocused ? colors.primary : colors.textMuted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={meta.label}
            onPress={onPress}
            className="flex-1 items-center justify-end gap-1 pb-1 pt-1"
          >
            <View>
              <Ionicons
                name={isFocused ? meta.iconActive : meta.icon}
                size={24}
                color={color}
              />
              {meta.badge && hasUnread ? (
                <View className="absolute -right-1.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
              ) : null}
            </View>
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

function CenterButton({
  meta,
  isFocused,
  onPress,
}: {
  meta: TabMeta;
  isFocused: boolean;
  onPress: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-end">
      <Pressable
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={meta.label}
        onPress={onPress}
        className="items-center"
      >
        {/* Floating circular button, lifted above the bar with a white ring */}
        <View
          style={{
            marginTop: -34,
            shadowColor: colors.primary,
            shadowOpacity: 0.45,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          }}
          className="h-[62px] w-[62px] items-center justify-center rounded-full border-4 border-white"
        >
          <LinearGradient
            colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: '100%',
              width: '100%',
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={meta.iconActive} size={26} color={colors.white} />
          </LinearGradient>
        </View>
        <Text
          style={{ color: isFocused ? colors.primary : colors.textMuted }}
          className={
            isFocused ? 'mt-1 text-[11px] font-semibold' : 'mt-1 text-[11px] font-medium'
          }
        >
          {meta.label}
        </Text>
      </Pressable>
    </View>
  );
}
