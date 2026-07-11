import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';

import { AuthPromptSheet } from '@/components/AuthPromptSheet';
import { TabBar } from '@/components/navigation/TabBar';
import { useAuth } from '@/lib/auth/AuthContext';
import { useNotificationsRealtime } from '@/lib/notifications/realtime';

// Tabs a guest can't open without an account. Home and Explore stay open
// so guests can keep browsing; once signed in, everything unlocks.
const PROTECTED_TABS = ['bookings', 'messages', 'profile'];

// Bottom tab navigator with a custom tab bar (raised center "Explore" map
// button). Screen order here sets left-to-right order in the bar, so
// `explore` sits in the middle of the five tabs.
export default function TabsLayout() {
  const router = useRouter();
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';
  const [authPromptVisible, setAuthPromptVisible] = useState(false);
  // Live notifications while in the app — booking updates, payments, chat
  // nudges land instantly (no polling wait).
  useNotificationsRealtime();

  return (
    <>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <TabBar
            {...props}
            isProtected={(name) =>
              !isAuthenticated && PROTECTED_TABS.includes(name)
            }
            onBlockedPress={() => setAuthPromptVisible(true)}
          />
        )}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="bookings" />
        <Tabs.Screen name="explore" />
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
