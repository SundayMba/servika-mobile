import { Tabs } from 'expo-router';

import { ArtisanTabBar } from '@/components/navigation/ArtisanTabBar';

// Artisan tab order (left → right). Screen files live alongside this layout.
export default function ProTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ArtisanTabBar {...props} />}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
