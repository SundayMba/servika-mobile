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
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SplashScreen } from '../components/SplashScreen';
import { colors } from '@/constants/colors';
import { QueryProvider } from '@/lib/query/QueryProvider';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { PhoneGateProvider } from '@/lib/phone/PhoneGate';
import { ApiStatusBadge } from '@/components/ApiStatusBadge';
import { useNotificationObserver } from '@/lib/push/useNotificationObserver';

ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);
  const [splashPainted, setSplashPainted] = useState(false);
  // Deep-link a tapped push notification to its booking.
  useNotificationObserver();

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
  );
}
