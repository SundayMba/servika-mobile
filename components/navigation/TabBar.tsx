import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassBar } from '@/components/navigation/GlassBar';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useChatUnreadCount } from '@/lib/chat/hooks';

type IconName = keyof typeof Ionicons.glyphMap;
type TabMeta = { label: string; icon: IconName; iconActive: IconName; badge?: boolean };

/** Keyed by the route name inside app/(tabs). Explore is the accented centre tab. */
const TABS: Record<string, TabMeta> = {
  home: { label: 'Home', icon: 'home-outline', iconActive: 'home' },
  bookings: { label: 'Bookings', icon: 'calendar-outline', iconActive: 'calendar' },
  explore: { label: 'Explore', icon: 'map-outline', iconActive: 'map' },
  messages: { label: 'Messages', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses', badge: true },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

type TabBarProps = BottomTabBarProps & {
  /** Returns true if a route requires the user to be signed in. */
  isProtected?: (routeName: string) => boolean;
  /** Called when a guest taps a protected tab (instead of navigating). */
  onBlockedPress?: () => void;
};

/**
 * Customer tab bar on a floating glass pill. The active tab is a soft rounded
 * highlight with an ink glyph and label; Explore sits in the middle as the one
 * orange circle. Every label is drawn in full.
 */
export function TabBar({ state, navigation, isProtected, onBlockedPress }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { status } = useAuth();
  const { data: unreadMessages } = useChatUnreadCount({ enabled: status === 'authenticated' });
  const hasUnread = (unreadMessages ?? 0) > 0;

  return (
    <GlassBar bottom={Math.max(insets.bottom, 6) + 2}>
      {state.routes.map((route, index) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const center = route.name === 'explore';

        const onPress = () => {
          if (Platform.OS !== 'web') Haptics.selectionAsync();
          if (isProtected?.(route.name)) {
            onBlockedPress?.();
            return;
          }
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        const color = focused ? colors.ink : colors.inkFaint;

        return (
          <Pressable key={route.key} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}} accessibilityLabel={meta.label} onPress={onPress} style={styles.tab}>
            {center ? (
              <View style={styles.centerItem}>
                <View style={[styles.orb, focused && styles.orbActive]}>
                  <Ionicons name={focused ? meta.iconActive : meta.icon} size={21} color={colors.white} />
                </View>
                <AppText weight={focused ? 'semibold' : 'medium'} numberOfLines={1} allowFontScaling={false} style={[styles.label, { color }]}>
                  {meta.label}
                </AppText>
              </View>
            ) : (
              <View style={[styles.item, focused && styles.itemActive]}>
                <View style={styles.glyph}>
                  <Ionicons name={focused ? meta.iconActive : meta.icon} size={21} color={color} />
                  {meta.badge && hasUnread ? <View style={styles.badge} /> : null}
                </View>
                <AppText weight={focused ? 'semibold' : 'medium'} numberOfLines={1} allowFontScaling={false} style={[styles.label, { color }]}>
                  {meta.label}
                </AppText>
              </View>
            )}
          </Pressable>
        );
      })}
    </GlassBar>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: { minWidth: 62, paddingHorizontal: 14, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 2 },
  itemActive: { backgroundColor: 'rgba(20,23,27,0.07)' },
  centerItem: { alignItems: 'center', justifyContent: 'center', gap: 2, height: 48 },
  orb: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentDeep, shadowColor: colors.accentDeep, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  orbActive: { transform: [{ scale: 1.06 }] },
  glyph: { width: 26, height: 24, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 0, right: -2, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accentDeep, borderWidth: 1.5, borderColor: colors.white },
  label: { fontSize: 10.5, letterSpacing: -0.1, textAlign: 'center' },
});
