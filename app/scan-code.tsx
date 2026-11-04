import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

/**
 * Reads an artisan's booking code out of whatever their QR holds: the link
 * (https://servika.com.ng/a/EMEKA42), the app link (servika://a/EMEKA42) or the bare code.
 * Anything else is not a Servika code.
 */
export function codeFromScan(data: string): string | null {
  const text = data.trim();
  const fromLink = text.match(/(?:servika\.com\.ng|servika:\/)\/a\/([A-Za-z0-9]{3,20})/i);
  if (fromLink) return fromLink[1].toUpperCase();
  if (/^[A-Za-z0-9]{3,20}$/.test(text)) return text.toUpperCase();
  return null;
}

// expo-camera is native: an app binary built before it was added has no module, so load it lazily
// and say so instead of crashing.
type CameraModule = typeof import('expo-camera');
let camera: CameraModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  camera = require('expo-camera') as CameraModule;
} catch {
  camera = null;
}
const noPermission = () => [null, undefined] as const;
const useCameraPermission = camera?.useCameraPermissions ?? noPermission;

/** Scan an artisan's Servika QR (on their phone, card or flyer) and go straight to booking them. */
export default function ScanCode() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notServika, setNotServika] = useState(false);
  const handled = useRef(false);
  const [status, ask] = useCameraPermission();
  const granted = status?.granted;
  const canAskAgain = status?.canAskAgain ?? true;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/book-by-code'));

  const onScan = ({ data }: { data: string }) => {
    if (handled.current) return;
    const code = codeFromScan(data);
    if (!code) {
      setNotServika(true);
      return;
    }
    handled.current = true;
    router.replace({ pathname: '/book-by-code', params: { code } });
  };

  const Camera = camera?.CameraView;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {Camera && granted ? (
        <Camera
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScan}
        />
      ) : null}

      {/* The frame to aim at. */}
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.frame} />
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.white} />
        </Pressable>
        <AppText weight="semibold" style={styles.title}>Scan an artisan&apos;s code</AppText>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {!Camera ? (
          <AppText style={styles.hint}>Update the app to scan codes. You can still type the code instead.</AppText>
        ) : !granted ? (
          <>
            <AppText style={styles.hint}>
              {canAskAgain ? 'Allow the camera to scan the QR on their phone, card or flyer.' : 'Camera access is off for Servika. Turn it on in your phone settings.'}
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => (canAskAgain ? ask?.() : Linking.openSettings())} style={styles.primary}>
              <AppText weight="semibold" style={styles.primaryLabel}>{canAskAgain ? 'Allow camera' : 'Open settings'}</AppText>
            </Pressable>
          </>
        ) : (
          <AppText style={styles.hint}>
            {notServika ? 'That QR is not a Servika code. Ask the artisan to show their Servika code.' : 'Point at the QR on their phone, card or flyer.'}
          </AppText>
        )}
        <Pressable accessibilityRole="button" onPress={() => router.replace('/book-by-code')} style={styles.secondary}>
          <AppText weight="semibold" style={styles.secondaryLabel}>Type the code instead</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const FRAME = 240;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B0D10' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME, borderRadius: 28, borderWidth: 3, borderColor: colors.accentDeep, backgroundColor: 'transparent' },
  top: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18 },
  close: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  title: { fontSize: 17, color: colors.white },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 24, gap: 12 },
  hint: { fontSize: 14, lineHeight: 20, textAlign: 'center', color: 'rgba(255,255,255,0.85)' },
  primary: { height: 52, borderRadius: 16, alignItems: 'stretch', justifyContent: 'center', backgroundColor: colors.accentDeep },
  primaryLabel: { fontSize: 15, textAlign: 'center', color: colors.white },
  secondary: { height: 48, borderRadius: 16, alignItems: 'stretch', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  secondaryLabel: { fontSize: 14, textAlign: 'center', color: colors.white },
});
