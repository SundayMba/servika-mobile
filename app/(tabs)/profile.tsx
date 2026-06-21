import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';

const TAB_BAR_HEIGHT = 60;

type IconName = keyof typeof Ionicons.glyphMap;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** One stat in the identity card (e.g. 12 Bookings). */
function Stat({
  icon,
  value,
  label,
  tint,
}: {
  icon: IconName;
  value: string;
  label: string;
  tint: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Ionicons name={icon} size={18} color={tint} />
      <Text className="mt-1 text-[16px] font-bold text-gray-900">{value}</Text>
      <Text className="text-[11px] text-gray-400">{label}</Text>
    </View>
  );
}

/** A Quick Access grid tile. */
function QuickTile({
  icon,
  label,
  tint,
  badge,
  onPress,
}: {
  icon: IconName;
  label: string;
  tint: string;
  badge?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="mb-1 w-1/4 items-center py-2 active:opacity-70"
    >
      <View
        style={{ backgroundColor: `${tint}1A` }}
        className="h-14 w-14 items-center justify-center rounded-2xl"
      >
        <Ionicons name={icon} size={24} color={tint} />
        {badge ? (
          <View className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
        ) : null}
      </View>
      <View className="mt-1.5 h-8 w-full px-0.5">
        <Text
          numberOfLines={2}
          className="text-center text-[11px] font-medium leading-[14px] text-gray-600"
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;
  const comingSoon = (label: string) =>
    Alert.alert(label, 'Coming soon.', [{ text: 'OK' }]);

  // Guests are normally gated before reaching this tab; safe fallback.
  if (!user) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-white px-8"
        edges={['top']}
      >
        <Ionicons name="person-circle-outline" size={56} color={colors.textMuted} />
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

  const quickAccess: {
    key: string;
    icon: IconName;
    label: string;
    tint: string;
    badge?: boolean;
    onPress: () => void;
  }[] = [
    { key: 'bookings', icon: 'calendar', label: 'Bookings', tint: '#3B82F6', onPress: () => router.push('/bookings') },
    { key: 'addresses', icon: 'location', label: 'Addresses', tint: '#22C55E', onPress: () => comingSoon('Addresses') },
    { key: 'wallet', icon: 'wallet', label: 'Wallet', tint: '#F97316', onPress: () => comingSoon('Wallet') },
    { key: 'payments', icon: 'card', label: 'Payments', tint: '#8B5CF6', onPress: () => comingSoon('Payments') },
    { key: 'notifications', icon: 'notifications', label: 'Notifications', tint: '#EF4444', badge: true, onPress: () => comingSoon('Notifications') },
    { key: 'help', icon: 'help-buoy', label: 'Help & Support', tint: '#14B8A6', onPress: () => comingSoon('Help & Support') },
    { key: 'settings', icon: 'settings', label: 'Settings', tint: '#64748B', onPress: () => router.push('/settings') },
    { key: 'invite', icon: 'gift', label: 'Invite & Earn', tint: '#EC4899', onPress: () => comingSoon('Invite & Earn') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <View className="flex-1">
          <Text className="text-[26px] font-bold text-gray-900">Profile</Text>
          <Text className="mt-0.5 text-[13px] text-gray-500">
            Manage your account and preferences
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => comingSoon('Notifications')}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border border-white bg-red-500" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}
      >
        {/* Identity + stats */}
        <View className="mt-2 rounded-3xl border border-gray-100/70 bg-white p-5">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Text className="text-[22px] font-bold text-primary">
                  {initials(user.fullName)}
                </Text>
              </View>
              <View className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-blue-500">
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-[17px] font-bold text-gray-900">
                {user.fullName}
              </Text>
              {user.phoneNumber ? (
                <Text className="mt-0.5 text-[13px] text-gray-500">
                  {user.phoneNumber}
                </Text>
              ) : null}
              <Text numberOfLines={1} className="text-[13px] text-gray-400">
                {user.email}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => comingSoon('Edit profile')}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="create-outline" size={14} color={colors.primary} />
              <Text className="text-[12px] font-semibold text-primary">Edit</Text>
            </Pressable>
          </View>

          <View className="mt-5 flex-row border-t border-gray-100 pt-4">
            <Stat icon="calendar-outline" value="0" label="Bookings" tint="#3B82F6" />
            <View className="w-px bg-gray-100" />
            <Stat icon="heart-outline" value="0" label="Saved" tint="#EC4899" />
            <View className="w-px bg-gray-100" />
            <Stat icon="wallet-outline" value="₦0" label="Total Spent" tint={colors.primary} />
          </View>
        </View>

        {/* Servika Plus */}
        <Pressable
          accessibilityRole="button"
          onPress={() => comingSoon('Servika Plus')}
          className="mt-4 overflow-hidden rounded-3xl"
        >
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <Ionicons name="star" size={20} color={colors.primaryLight} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[15px] font-bold text-white">Servika Plus</Text>
              <Text className="mt-0.5 text-[12px] leading-4 text-gray-300">
                Priority support, exclusive benefits and special offers.
              </Text>
            </View>
            <View className="rounded-full bg-primary px-3.5 py-2">
              <Text className="text-[12px] font-bold text-white">Upgrade</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Quick Access */}
        <Text className="mb-1 mt-6 px-1 text-[16px] font-bold text-gray-900">
          Quick Access
        </Text>
        <View className="rounded-3xl border border-gray-100/70 bg-white px-2 py-3">
          <View className="flex-row flex-wrap">
            {quickAccess.map((t) => (
              <QuickTile
                key={t.key}
                icon={t.icon}
                label={t.label}
                tint={t.tint}
                badge={t.badge}
                onPress={t.onPress}
              />
            ))}
          </View>
        </View>

        {/* Support card */}
        <Pressable
          accessibilityRole="button"
          onPress={() => comingSoon('Contact Support')}
          className="mt-4 overflow-hidden rounded-3xl"
        >
          <LinearGradient
            colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 18 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[15px] font-bold text-white">
                  Need help with a service?
                </Text>
                <Text className="mt-1 text-[12px] leading-4 text-white/90">
                  Our support team is ready to assist you.
                </Text>
                <View className="mt-3 self-start rounded-full bg-white px-4 py-2">
                  <Text className="text-[12px] font-bold text-primary">
                    Contact Support
                  </Text>
                </View>
              </View>
              <Ionicons name="headset-outline" size={48} color="rgba(255,255,255,0.85)" />
            </View>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
