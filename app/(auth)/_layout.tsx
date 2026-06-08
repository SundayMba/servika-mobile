import { Stack } from 'expo-router';

import { colors } from '@/constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 220,
        // Auth screens are white — keep the transition scene white.
        contentStyle: { backgroundColor: colors.white },
      }}
    />
  );
}
