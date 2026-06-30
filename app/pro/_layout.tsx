import { Stack } from 'expo-router';

import { colors } from '@/constants/colors';

/**
 * "Servika Pro" — the artisan/provider surface. A user is routed here when their
 * account role is `Artisan` (see app/index.tsx). It's a sibling stack under the
 * root navigator; the tabbed area lives in the nested (tabs) group, and the
 * onboarding/KYC/job-flow screens are pushed on top as plain stack routes.
 *
 * Batch-5 scope: UI/mock-state only — no backend wiring yet (artisan
 * booking-transition endpoints, live tracking and real withdrawals land later).
 */
export default function ProLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 220,
        contentStyle: { backgroundColor: colors.white },
      }}
    >
      <Stack.Screen name="(tabs)" />
      {/* Onboarding hero is full-bleed navy — match the transition scene. */}
      <Stack.Screen name="onboarding" options={{ contentStyle: { backgroundColor: '#0B1220' } }} />
    </Stack>
  );
}
