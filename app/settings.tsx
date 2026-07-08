import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';

const SUPPORT_EMAIL = 'support@servika.com';
const openSupport = () =>
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Servika%20Support`).catch(() => {});

type IconName = keyof typeof Ionicons.glyphMap;

/** A tappable settings row with leading icon, optional badge, and chevron. */
function MenuRow({
  icon,
  label,
  badge,
  badgeTone = 'muted',
  onPress,
  last,
}: {
  icon: IconName;
  label: string;
  badge?: string;
  badgeTone?: 'muted' | 'warning';
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`flex-row items-center gap-3 py-3.5 active:opacity-60 ${last ? '' : 'border-b border-gray-100'}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text className="flex-1 text-[15px] font-medium text-gray-800">{label}</Text>
      {badge ? (
        <View
          className={
            badgeTone === 'warning'
              ? 'rounded-full bg-amber-50 px-2.5 py-1'
              : 'rounded-full bg-background px-2.5 py-1'
          }
        >
          <Text
            className={
              badgeTone === 'warning'
                ? 'text-[11px] font-semibold text-amber-600'
                : 'text-[11px] font-semibold text-gray-500'
            }
          >
            {badge}
          </Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mt-6">
      <Text className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </Text>
      <View className="rounded-3xl border border-gray-100/70 bg-white px-4">
        {children}
      </View>
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await signOut();
            router.replace('/home');
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text className="ml-2 text-[20px] font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <MenuSection title="Account">
          <MenuRow
            icon="person-outline"
            label="Edit profile"
            onPress={() => router.push('/edit-profile')}
          />
          <MenuRow
            icon="calendar-outline"
            label="My bookings"
            onPress={() => router.push('/bookings')}
          />
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push('/notifications')}
          />
          <MenuRow
            icon="lock-closed-outline"
            label="Change password"
            onPress={() => router.push('/forgot-password')}
            last
          />
        </MenuSection>

        <MenuSection title="Support">
          <MenuRow
            icon="help-circle-outline"
            label="Help & support"
            onPress={openSupport}
          />
          <MenuRow
            icon="information-circle-outline"
            label="About Servika"
            onPress={() => Linking.openURL('https://servika.com').catch(() => {})}
            last
          />
        </MenuSection>

        {/* Dev-only: preview the artisan ("Servika Pro") app without an artisan
            account. In production, role-based routing (app/index.tsx) sends real
            Artisan accounts straight to /pro/dashboard instead. */}
        {__DEV__ ? (
          <MenuSection title="Developer">
            <MenuRow
              icon="construct-outline"
              label="Open Artisan App (Pro)"
              onPress={() => router.push('/pro/onboarding')}
              last
            />
          </MenuSection>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          disabled={loggingOut}
          onPress={handleLogout}
          className="mt-6 h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 active:opacity-80"
          style={{ opacity: loggingOut ? 0.6 : 1 }}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-[15px] font-bold text-red-500">
            {loggingOut ? 'Logging out…' : 'Log out'}
          </Text>
        </Pressable>

        <Text className="mt-5 text-center text-[12px] text-gray-400">
          Servika v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
