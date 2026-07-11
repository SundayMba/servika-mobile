import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { authErrorMessage, updateProfile } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

function Field({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        className="h-14 rounded-2xl border border-gray-200 bg-white px-4 text-[15px] text-gray-900"
        {...inputProps}
      />
    </View>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateProfile({ fullName: fullName.trim(), phoneNumber: phone.trim() });
      await updateUser(updated);
      router.back();
    } catch (e) {
      setError(authErrorMessage(e, 'Could not save your profile.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
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
        <Text className="ml-2 text-[20px] font-bold text-gray-900">Edit Profile</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        >
          <Field
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            placeholder="Your full name"
          />
          <Field
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+234…"
          />

          {/* Email is shown read-only — changing it needs re-verification. */}
          <View className="mb-4">
            <Text className="mb-1.5 text-[13px] font-semibold text-gray-700">Email</Text>
            <View className="h-14 flex-row items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4">
              <Text className="text-[15px] text-gray-500">{user?.email}</Text>
              <Ionicons name="lock-closed" size={15} color={colors.textMuted} />
            </View>
          </View>

          {error ? (
            <Text className="mb-2 text-[13px] font-medium text-red-500">{error}</Text>
          ) : null}

          <View className="mt-3">
            <Button label={saving ? 'Saving…' : 'Save changes'} disabled={saving} onPress={save} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
