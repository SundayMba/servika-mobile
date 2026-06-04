import { Stack } from 'expo-router';

// Minimal stack for now. When the search / categories / bookings / profile
// screens exist, swap this for a <Tabs> navigator with the bottom tab bar.
export default function TabsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
