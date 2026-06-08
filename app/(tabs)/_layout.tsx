import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { TabBar } from '@/components/navigation/TabBar';

// Tabs a guest can't open without an account. Home and Categories stay open
// so guests can keep browsing.
const PROTECTED_TABS = ['bookings', 'messages', 'profile'];

// Bottom tab navigator with a custom tab bar (raised center "Categories"
// button). Screen order here sets left-to-right order in the bar, so
// `categories` sits in the middle of the five tabs.
export default function TabsLayout() {
  const router = useRouter();
  const [authPromptVisible, setAuthPromptVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <TabBar
            {...props}
            isProtected={(name) => PROTECTED_TABS.includes(name)}
            onBlockedPress={() => setAuthPromptVisible(true)}
          />
        )}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="bookings" />
        <Tabs.Screen name="categories" />
        <Tabs.Screen name="messages" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <AuthPromptSheet
        visible={authPromptVisible}
        onClose={() => setAuthPromptVisible(false)}
        title="Sign up to continue"
        message="Create an account to manage your bookings, messages and profile."
        icon="lock-closed"
        onSignUp={() => {
          setAuthPromptVisible(false);
          router.push('/register');
        }}
        onLogin={() => {
          setAuthPromptVisible(false);
          router.push('/login');
        }}
      />
    </>
  );
}
