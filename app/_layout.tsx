import '@/global.css';
import { Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SplashScreen } from '../components/SplashScreen';
import { colors } from '@/constants/colors';

ExpoSplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts or other async resources here
      } catch (e) {
        console.warn(e);
      } finally {
        setAppReady(true);
        await ExpoSplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appReady) return null;

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
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
  );
}
