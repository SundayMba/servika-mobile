import { Tabs } from 'expo-router';

import { TabBar } from '@/components/navigation/TabBar';

// Bottom tab navigator with a custom tab bar (raised center "Categories"
// button). Screen order here sets left-to-right order in the bar, so
// `categories` sits in the middle of the five tabs.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="categories" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
