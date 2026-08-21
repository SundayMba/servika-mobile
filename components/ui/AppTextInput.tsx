import { cssInterop } from 'nativewind';
import { forwardRef } from 'react';
import { TextInput, type TextInputProps, type TextStyle } from 'react-native';

import { fonts } from '@/constants/colors';

/**
 * A TextInput in the app's typeface.
 *
 * The same gap AppText closes, on the other half of the text in the app: React
 * Native gives a TextInput no font inheritance either, so a field left alone
 * types in the system face while the label above it is Instrument Sans. It
 * shows up most on the screens made of nothing but fields — sign-in, the
 * booking form, chat.
 *
 * The family covers the placeholder as well as the entered text.
 */

type Weight = 'regular' | 'medium' | 'semibold';

const WEIGHTS: Record<Weight, TextStyle> = {
  regular: { fontFamily: fonts.regular },
  medium: { fontFamily: fonts.medium },
  semibold: { fontFamily: fonts.semibold },
};

export interface AppTextInputProps extends TextInputProps {
  weight?: Weight;
  /** Resolved by NativeWind — see the cssInterop registration at the foot. */
  className?: string;
}

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  function AppTextInput({ weight = 'regular', style, ...rest }, ref) {
    return <TextInput ref={ref} style={[WEIGHTS[weight], style]} {...rest} />;
  },
);

/** Without this, `className` on an AppTextInput is dropped silently. */
cssInterop(AppTextInput, { className: 'style' });
