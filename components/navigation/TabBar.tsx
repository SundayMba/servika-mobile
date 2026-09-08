import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { useChatUnreadCount } from '@/lib/chat/hooks';

type IconName = keyof typeof Ionicons.glyphMap;

type TabMeta = {
  label: string;
  /** One glyph, outline, in both states — v2 marks the active tab with ink and
   *  weight rather than by swapping in a filled variant. */
  icon: IconName;
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
  home: { label: 'Home', icon: 'home-outline' },
  bookings: { label: 'Bookings', icon: 'calendar-outline' },
  explore: { label: 'Explore', icon: 'map-outline' },
  messages: { label: 'Messages', icon: 'chatbubble-ellipses-outline', badge: true },
  profile: { label: 'Profile', icon: 'person-outline' },
};

type TabBarProps = BottomTabBarProps & {
  /** Returns true if a route requires the user to be signed in. */
  isProtected?: (routeName: string) => boolean;
  /** Called when a guest taps a protected tab (instead of navigating). */
  onBlockedPress?: () => void;
};

/**
 * The v2 tab bar, from the Servika design canvas.
 *
 * What changed from v1: a flat translucent-white slab with a hairline top edge
 * instead of a 28pt rounded card on a drop shadow; outline glyphs throughout,
 * with the active tab picked out in ink rather than orange; and a plain solid
 * raised button in place of the gradient one. The whole bar is quieter, which
 * is the point — it sits under every screen and was the loudest thing on most
 * of them.
 *
 * The design shows the slab blurred. expo-blur is not a dependency and adding
 * it means a native rebuild, so the fill stands in for it — see the note on
 * `bar` below for why it is 96% rather than the canvas's 92%.
 */
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
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
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

        const color = isFocused ? colors.white : colors.inkFaint;
        const labelColor = isFocused ? colors.ink : colors.inkFaint;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={meta.label}
            onPress={onPress}
            style={styles.tab}
          >
            <View style={[styles.glyph, isFocused && styles.glyphActive]}>
              <Ionicons name={meta.icon} size={21} color={color} />
              {meta.badge && hasUnread ? <View style={styles.badge} /> : null}
            </View>
            <AppText
              weight={isFocused ? 'semibold' : 'medium'}
              numberOfLines={1}
              allowFontScaling={false}
              style={[styles.label, { color: labelColor }]}
            >
              {meta.label}
            </AppText>
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
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={meta.label}
      onPress={onPress}
      style={styles.centerTab}
    >
      {/* Raised, ringed in the bar's own white so it reads as cut out of it.
          No gradient and no glow — the canvas draws it flat. */}
      <View style={styles.raised}>
        <Ionicons name={meta.icon} size={23} color={colors.white} />
      </View>
      <AppText
        weight={isFocused ? 'semibold' : 'medium'}
        numberOfLines={1}
        style={[styles.label, styles.centerLabel, { color: isFocused ? colors.ink : colors.inkFaint }]}
      >
        {meta.label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingTop: 14,
    // The canvas specifies 92% white over a 12px backdrop blur. expo-blur is
    // not a dependency and adding it needs a native rebuild, so there is no
    // blur — and at 92% the content scrolling underneath stays sharp and
    // legible through the bar, which reads as a bug rather than as glass. 96%
    // keeps the faint warmth of the sand showing through without the noise.
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  tab: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    // 'stretch' with a centred label, so the text box fills its column instead
    // of shrink-wrapping — Android clips whatever overflows a shrink-wrapped
    // Text, which is how "Bookings" lost its final glyph before.
    alignItems: 'stretch',
    gap: 4,
  },
  glyph: {
    // The column is 'stretch' so the label can fill it; the icon has to opt
    // back out or it lands hard against the left edge. A rounded slot so the
    // active tab can fill with the primary orange.
    alignSelf: 'center',
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphActive: { backgroundColor: colors.primary },
  centerTab: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    alignItems: 'center',
  },
  raised: {
    position: 'absolute',
    top: -28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.accentDeep,
    borderWidth: 4,
    borderColor: colors.white,
  },
  label: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  centerLabel: {
    marginTop: 33,
    alignSelf: 'stretch',
  },
  badge: {
    position: 'absolute',
    top: 3,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 999,
    // The accent, not alarm red. An unread message is not an error, and the
    // canvas carries the same dot in the accent on the header bell and the
    // Notifications tile — one colour for "there is something here".
    backgroundColor: colors.accentDeep,
  },
});
