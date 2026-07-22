import '@/global.css';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useState } from 'react';
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
  // Deep-link a tapped push notification to its booking.
  useNotificationObserver();

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
            onReady={() => ExpoSplashScreen.hideAsync()}
            onFinish={() => setSplashDone(true)}
          />
        ) : null}
        </PhoneGateProvider>
      </AuthProvider>
    </QueryProvider>
    </KeyboardProvider>
  );
}
