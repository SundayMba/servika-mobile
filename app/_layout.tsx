import '@/global.css';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  useFonts,
} from '@expo-google-fonts/instrument-sans';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SplashScreen } from '../components/SplashScreen';
import { colors } from '@/constants/colors';
import { QueryProvider } from '@/lib/query/QueryProvider';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { PhoneGateProvider } from '@/lib/phone/PhoneGate';
import { ApiStatusBadge } from '@/components/ApiStatusBadge';
import { NotificationObserver } from '@/components/NotificationObserver';
import { AppAlertHost } from '@/components/ui/AppAlert';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

ExpoSplashScreen.preventAutoHideAsync();

// expo-router mounts whatever a route file exports as `ErrorBoundary` around
// that segment; exported from the root layout it wraps the entire app, so a
// throw during render shows a screen the customer can act on instead of a
// blank window. Named export, not default — the default export is the layout.
export { AppErrorBoundary as ErrorBoundary };

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const [splashPainted, setSplashPainted] = useState(false);

  // Instrument Sans, for onboarding. Three weights only — the ones the design
  // uses — since each is a separate file in the bundle. They ship with the app
  // rather than being fetched, so this resolves in milliseconds; the animated
  // splash below is already covering that window, and the tree renders
  // underneath meanwhile, so a slow load costs nothing but a font swap.
  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });

  // Hide the native splash once the animated one has painted AND the fonts are
  // in, whichever lands last — gating on only one of them can strand it.
  useEffect(() => {
    if (splashPainted && fontsLoaded) void ExpoSplashScreen.hideAsync();
  }, [splashPainted, fontsLoaded]);

  return (
    // Gesture handler needs a root view above everything that uses a gesture —
    // without it the swipe-back detector never receives touches on Android.
    <GestureHandlerRootView style={{ flex: 1 }}>
    <KeyboardProvider>
    <QueryProvider>
      <AuthProvider>
        <PhoneGateProvider>
        <Stack
        screenOptions={{
          headerShown: false,
          // Light, consistent horizontal slide between screens.
          animation: 'slide_from_right',
          animationDuration: 220,
          // Scene background during the transition — avoids the white flash
          // before the incoming screen paints.
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* The artisan profile is a white screen — match the transition scene. */}
        <Stack.Screen
          name="artisan/[id]"
          options={{ contentStyle: { backgroundColor: colors.white } }}
        />
        </Stack>
        {/* Dev-only API connectivity indicator (Slice 0 rails check). */}
        <ApiStatusBadge />
        {/* Servika's own alert dialog. Mounted once here, above the Stack, so
            appAlert() works from any screen and any callback — including ones
            that fire after the calling screen has already navigated away. */}
        <AppAlertHost />
        {/* Deep-links a tapped push notification to its booking or chat. A
            component rather than a hook call up here, because it needs the
            auth status this layout is the one providing. */}
        <NotificationObserver />
        {/* Animated splash OVERLAYS the app while it boots beneath — its fade
            reveals the real first screen (no blank window after the animation).
            The native splash hides only once this has painted (onReady). */}
        {!splashDone ? (
          <SplashScreen
            onReady={() => setSplashPainted(true)}
            onFinish={() => setSplashDone(true)}
          />
        ) : null}
        </PhoneGateProvider>
      </AuthProvider>
    </QueryProvider>
    </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
