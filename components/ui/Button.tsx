import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  Text,
} from 'react-native';

import { colors } from '@/constants/colors';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'outline';
  loading?: boolean;
};

/**
 * Reusable button. `primary` is the filled brand button; `outline` is a
 * bordered secondary. Shows a spinner and blocks presses while `loading`.
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={[
        isPrimary
          ? {
              shadowColor: colors.primary,
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }
          : undefined,
        typeof style === 'function' ? undefined : style,
      ]}
      className={[
        'h-14 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90',
        isPrimary ? 'bg-primary' : 'border border-gray-200 bg-white',
        isDisabled ? 'opacity-60' : '',
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? colors.white : colors.primary}
        />
      ) : (
        <Text
          className={
            isPrimary
              ? 'text-[16px] font-bold text-white'
              : 'text-[16px] font-bold text-gray-900'
          }
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
