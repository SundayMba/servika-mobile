import { Stack } from 'expo-router';

import { colors } from '@/constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 220,
        // Auth screens are warm ink: keep the transition scene the same colour.
        contentStyle: { backgroundColor: colors.inkWarm },
      }}
    />
  );
}
