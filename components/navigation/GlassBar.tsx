import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/*
 * Floating glass tab bar: a pill inset from the screen edges with the content
 * blurred behind it. Uses expo-blur when the binary has it (lazy-required so a
 * build made before it was added still runs) and a frosted translucent fill
 * otherwise, which is also what Android shows when blur is unavailable.
 */
let Blur: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Blur = require('expo-blur').BlurView;
} catch {
  Blur = null;
}

export const GLASS_BAR_HEIGHT = 68;
export const GLASS_BAR_MARGIN = 14;

export function GlassBar({ children, bottom }: { children: ReactNode; bottom: number }) {
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <View style={styles.pill}>
        {Blur ? <Blur intensity={Platform.OS === 'ios' ? 40 : 60} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Blur ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.9)' }]} />
        <View style={styles.row}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: GLASS_BAR_MARGIN, right: GLASS_BAR_MARGIN },
  pill: {
    height: GLASS_BAR_HEIGHT,
    borderRadius: GLASS_BAR_HEIGHT / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
});
