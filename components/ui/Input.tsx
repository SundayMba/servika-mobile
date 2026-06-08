import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { colors } from '@/constants/colors';

type InputProps = TextInputProps & {
  /** Leading icon shown inside the field. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Renders the field as a password input with a show/hide toggle. */
  password?: boolean;
  /** Optional label rendered above the field. */
  label?: string;
};

/**
 * Reusable form field: rounded surface with a leading icon and, for password
 * fields, a trailing show/hide toggle. Forwards remaining TextInput props and
 * its ref (so screens can chain focus across fields).
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { icon, password = false, label, ...props },
  ref,
) {
  const [hidden, setHidden] = useState(password);

  return (
    <View>
      {label ? (
        <Text className="mb-1.5 text-[13px] font-medium text-gray-700">
          {label}
        </Text>
      ) : null}
      <View className="h-14 flex-row items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4">
        {icon ? (
          <Ionicons name={icon} size={20} color={colors.primary} />
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password ? hidden : false}
          className="flex-1 text-[15px] text-gray-900"
          {...props}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            onPress={() => setHidden((h) => !h)}
          >
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});
