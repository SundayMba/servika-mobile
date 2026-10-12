import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeOut, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useOtaUpdates, useStoreUpdates } from '@/lib/updates/useAppUpdates';

/** Room for the tab bar, so the bar never covers navigation. */
const ABOVE_TABS = 76;

/**
 * A short snackbar near the bottom once a JS update has downloaded: "Update
 * ready · Restart". The close button dismisses it; the update then applies the
 * next time the app opens. Also starts Google Play's in-app update flow.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const ota = useOtaUpdates();
  useStoreUpdates();
  if (!ota.ready) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + ABOVE_TABS }]}>
      <Animated.View
        entering={SlideInDown.duration(320).easing(Easing.out(Easing.cubic))}
        exiting={FadeOut.duration(160)}
        style={styles.bar}
      >
        <Ionicons name="sparkles" size={15} color="#FDBA74" />
        <AppText weight="semibold" style={styles.text} numberOfLines={1}>Update ready</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Restart to update" onPress={ota.restart} hitSlop={8} style={styles.restart}>
          <AppText weight="semibold" style={styles.restartText}>Restart</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={ota.later} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 12, right: 12, alignItems: 'center', zIndex: 50 },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch',
    backgroundColor: '#0B1220', borderRadius: 14, paddingLeft: 14, paddingRight: 6, height: 48,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  text: { flex: 1, fontSize: 14, color: '#FFFFFF' },
  restart: { paddingHorizontal: 10, paddingVertical: 8 },
  restartText: { fontSize: 14, color: '#FB923C' },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
