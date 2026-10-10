import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useOtaUpdates, useStoreUpdates } from '@/lib/updates/useAppUpdates';

/**
 * Sits at the top of the app. Appears only once a JS update has finished
 * downloading, offers a restart, and gets out of the way on "Later" (the
 * update then applies on the next cold start). Also kicks off Google Play's
 * own in-app update flow for native releases.
 */
export function UpdateBanner() {
  const insets = useSafeAreaInsets();
  const ota = useOtaUpdates();
  useStoreUpdates();
  if (!ota.ready) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingTop: insets.top + 8 }]}>
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <AppText weight="semibold" style={styles.title}>A small update is ready</AppText>
          <AppText style={styles.body}>Restart to get it now, or it applies next time you open the app.</AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={ota.later} hitSlop={8} style={styles.later}>
          <AppText weight="medium" style={styles.laterText}>Later</AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={ota.restart} style={styles.restart}>
          <AppText weight="semibold" style={styles.restartText}>Restart</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, zIndex: 50 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0B1220', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  title: { fontSize: 14, color: '#FFFFFF' },
  body: { fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  later: { paddingHorizontal: 6, paddingVertical: 8 },
  laterText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  restart: { backgroundColor: '#F97316', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  restartText: { fontSize: 13, color: '#221004' },
});
