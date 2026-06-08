import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { colors } from '@/constants/colors';

type AuthPromptSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Headline shown in the sheet. */
  title?: string;
  /** Supporting copy beneath the headline. */
  message?: string;
  /** Icon shown in the tinted badge. */
  icon?: keyof typeof Ionicons.glyphMap;
  onSignUp?: () => void;
  onLogin?: () => void;
};

export function AuthPromptSheet({
  visible,
  onClose,
  title = 'Create an account to continue',
  message = 'Sign up to book services and track your jobs in real time.',
  icon = 'lock-closed',
  onSignUp,
  onLogin,
}: AuthPromptSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Icon badge */}
      <View className="mb-4 items-center">
        <View
          style={{ backgroundColor: `${colors.primary}14` }}
          className="h-16 w-16 items-center justify-center rounded-full"
        >
          <Ionicons name={icon} size={28} color={colors.primary} />
        </View>
      </View>

      {/* Copy */}
      <Text className="text-center text-[19px] font-bold text-gray-900">
        {title}
      </Text>
      <Text className="mt-2 text-center text-[14px] leading-5 text-gray-500">
        {message}
      </Text>

      {/* Actions */}
      <View className="mt-6 gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={onSignUp ?? onClose}
          style={{
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
          className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90"
        >
          <Text className="text-[16px] font-bold text-white">Sign Up</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onLogin ?? onClose}
          className="h-14 items-center justify-center rounded-2xl border border-gray-200 bg-white active:bg-gray-50"
        >
          <Text className="text-[16px] font-bold text-gray-900">Log In</Text>
        </Pressable>
      </View>

      {/* Dismiss */}
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        hitSlop={8}
        className="mt-4 items-center py-1"
      >
        <Text className="text-[14px] font-semibold text-gray-400">
          Continue browsing
        </Text>
      </Pressable>
    </BottomSheet>
  );
}
