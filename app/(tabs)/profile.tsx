import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';

const TAB_BAR_HEIGHT = 60;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

type IconName = keyof typeof Ionicons.glyphMap;

/** A tappable settings/menu row with leading icon, optional badge, and chevron. */
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

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

  // Guests are normally gated before reaching this tab; safe fallback.
  if (!user) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-white px-8"
        edges={['top']}
      >
        <Ionicons
          name="person-circle-outline"
          size={56}
          color={colors.textMuted}
        />
        <Text className="mt-4 text-center text-[16px] font-semibold text-gray-900">
          You&apos;re browsing as a guest
        </Text>
        <Text className="mt-1 text-center text-[14px] leading-5 text-gray-500">
          Sign in to manage your profile, bookings and messages.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login')}
          className="mt-6 h-12 w-full items-center justify-center rounded-2xl bg-primary"
        >
          <Text className="text-[15px] font-bold text-white">Sign in</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/register')}
          className="mt-3"
          hitSlop={8}
        >
          <Text className="text-[14px] font-semibold text-primary">
            Create an account
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Placeholder for features not yet built — keeps the menu honest about state.
  const comingSoon = (label: string) =>
    Alert.alert(label, 'Coming soon.', [{ text: 'OK' }]);

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
      <View className="px-5 pb-1 pt-2">
        <Text className="text-[26px] font-bold text-gray-900">Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}
      >
        {/* Identity card */}
        <View className="mt-3 flex-row items-center gap-4 rounded-3xl border border-gray-100/70 bg-white p-5">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Text className="text-[22px] font-bold text-primary">
              {initials(user.fullName)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[18px] font-bold text-gray-900">
              {user.fullName}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 text-[13px] text-gray-500">
              {user.email}
            </Text>
            <View className="mt-1.5 flex-row items-center gap-1 self-start rounded-full bg-background px-2.5 py-1">
              <Ionicons
                name="shield-checkmark"
                size={12}
                color={colors.primary}
              />
              <Text className="text-[11px] font-semibold text-gray-600">
                {user.role}
              </Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <MenuSection title="Account">
          <MenuRow
            icon="person-outline"
            label="Edit profile"
            onPress={() => comingSoon('Edit profile')}
          />
          <MenuRow
            icon="call-outline"
            label="Phone number"
            badge={user.phoneNumber ? 'Unverified' : 'Add'}
            badgeTone="warning"
            onPress={() => comingSoon('Verify phone number')}
          />
          <MenuRow
            icon="lock-closed-outline"
            label="Change password"
            onPress={() => comingSoon('Change password')}
            last
          />
        </MenuSection>

        {/* Activity */}
        <MenuSection title="Activity">
          <MenuRow
            icon="calendar-outline"
            label="My bookings"
            onPress={() => router.push('/bookings')}
          />
          <MenuRow
            icon="heart-outline"
            label="Saved artisans"
            onPress={() => comingSoon('Saved artisans')}
          />
          <MenuRow
            icon="card-outline"
            label="Payment methods"
            onPress={() => comingSoon('Payment methods')}
          />
          <MenuRow
            icon="location-outline"
            label="Saved addresses"
            onPress={() => comingSoon('Saved addresses')}
            last
          />
        </MenuSection>

        {/* Support */}
        <MenuSection title="Support">
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => comingSoon('Notifications')}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Help & support"
            onPress={() => comingSoon('Help & support')}
          />
          <MenuRow
            icon="information-circle-outline"
            label="About Servika"
            onPress={() => comingSoon('About Servika')}
            last
          />
        </MenuSection>

        {/* Logout */}
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
