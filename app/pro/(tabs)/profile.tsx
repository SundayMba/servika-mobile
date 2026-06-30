import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArtisanProfileHeader,
  ArtisanProfileMenuRow,
  PublicProfileButton,
} from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { MOCK_ME } from '@/lib/artisan/mock';
import { useAuth } from '@/lib/auth/AuthContext';

const TAB_BAR_HEIGHT = 60;

export default function ProProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const comingSoon = (label: string) => Alert.alert(label, 'Coming soon.', [{ text: 'OK' }]);
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

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
      <View className="flex-row items-center justify-between px-5 py-2">
        <Text className="text-[22px] font-bold text-gray-900">My Profile</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          onPress={() => comingSoon('Edit profile')}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="create-outline" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}
      >
        {/* Identity */}
        <View className="mt-2 rounded-3xl border border-gray-100 bg-white p-5">
          <ArtisanProfileHeader
            name={user?.fullName ?? MOCK_ME.name}
            specialty={MOCK_ME.specialty}
            rating={MOCK_ME.rating}
            reviewCount={MOCK_ME.reviewCount}
            imageKey={MOCK_ME.imageKey}
            verified={MOCK_ME.verified}
          />
        </View>

        {/* Menu */}
        <View className="mt-4 rounded-3xl border border-gray-100 bg-white px-4">
          <ArtisanProfileMenuRow
            icon="person-outline"
            label="Profile Information"
            onPress={() => comingSoon('Profile Information')}
          />
          <ArtisanProfileMenuRow
            icon="location-outline"
            label="Service Areas"
            detail={MOCK_ME.serviceAreas}
            onPress={() => comingSoon('Service Areas')}
          />
          <ArtisanProfileMenuRow
            icon="construct-outline"
            label="My Services"
            detail="5 services"
            onPress={() => router.push('/pro/service-setup')}
          />
          <ArtisanProfileMenuRow
            icon="images-outline"
            label="Work Portfolio"
            detail="12 Photos"
            onPress={() => comingSoon('Work Portfolio')}
          />
          <ArtisanProfileMenuRow
            icon="star-outline"
            label="Reviews"
            detail="124 Reviews"
            onPress={() => comingSoon('Reviews')}
          />
          <ArtisanProfileMenuRow
            icon="settings-outline"
            label="Account Settings"
            onPress={() => comingSoon('Account Settings')}
            last
          />
        </View>

        <View className="mt-4">
          <PublicProfileButton onPress={() => comingSoon('Public profile')} />
        </View>

        {/* Verification shortcut */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/pro/kyc')}
          className="mt-3 flex-row items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 active:opacity-80"
        >
          <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
          <Text className="flex-1 text-[13px] font-semibold text-green-700">
            Your account is fully verified
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#16A34A" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          disabled={loggingOut}
          onPress={handleLogout}
          className="mt-4 h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 active:opacity-80"
          style={{ opacity: loggingOut ? 0.6 : 1 }}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-[15px] font-bold text-red-500">
            {loggingOut ? 'Logging out…' : 'Log out'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
