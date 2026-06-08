import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';

import { GoogleIcon } from '@/components/ui/GoogleIcon';
import { colors } from '@/constants/colors';

type SocialAuthButtonsProps = {
  onGoogle?: () => void;
  onApple?: () => void;
};

/**
 * "Or continue with" divider followed by side-by-side Google / Apple buttons.
 * Shared by the login and register screens. Visual placeholders for now.
 */
export function SocialAuthButtons({
  onGoogle,
  onApple,
}: SocialAuthButtonsProps) {
  return (
    <View>
      <View className="mb-5 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-gray-200" />
        <Text className="text-[13px] text-gray-400">Or continue with</Text>
        <View className="h-px flex-1 bg-gray-200" />
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          onPress={onGoogle}
          className="h-14 flex-1 flex-row items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white"
        >
          <GoogleIcon size={20} />
          <Text className="text-[15px] font-semibold text-gray-900">Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          onPress={onApple}
          className="h-14 flex-1 flex-row items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white"
        >
          <Ionicons name="logo-apple" size={22} color={colors.textPrimary} />
          <Text className="text-[15px] font-semibold text-gray-900">Apple</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
