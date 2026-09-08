import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts } from '@/constants/colors';

/*
 * The customer auth kit (design stage 2, screens 10 to 18): warm ink screens,
 * cream type, underline fields whose label and rule turn orange on focus, one
 * orange bar to press with a darker tile carrying the arrow, and a woven strip
 * motif on the lip of the sheet. It mirrors Servika Pro's auth kit so the two
 * apps read as one product.
 */

/** Aso oke style strip drawn from crossing lines: crisp at any size. */
export function WovenStrip({ opacity = 0.55, style }: { opacity?: number; style?: StyleProp<ViewStyle> }) {
  const { width } = useWindowDimensions();
  const w = Math.max(width, 320);
  const step = 9;
  const n = Math.ceil(w / step);
  return (
    <View pointerEvents="none" style={[{ height: 10, opacity }, style]}>
      <Svg width={w} height={10}>
        {Array.from({ length: n }).map((_, i) => (
          <Line key={`a${i}`} x1={i * step} y1={0} x2={i * step + step} y2={10} stroke={colors.orangeOnDark} strokeWidth={1} />
        ))}
        {Array.from({ length: n }).map((_, i) => (
          <Line key={`b${i}`} x1={i * step + step} y1={0} x2={i * step} y2={10} stroke={colors.onInkMeta} strokeWidth={0.8} />
        ))}
      </Svg>
    </View>
  );
}

export function AuthScreen({
  kicker,
  back = true,
  onBack,
  children,
  footer,
  topRight,
  contentStyle,
}: {
  kicker?: string;
  back?: boolean;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  topRight?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')));
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.topRow, { paddingTop: insets.top + 10 }]}>
        {back ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={goBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={18} color={colors.onInk} />
          </Pressable>
        ) : null}
        {kicker ? (
          <AppText weight="semibold" style={styles.kicker}>
            {kicker.toUpperCase()}
          </AppText>
        ) : null}
        <View style={{ flex: 1 }} />
        {topRight}
      </View>
      <WovenStrip opacity={0.28} style={{ marginBottom: 6 }} />
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, contentStyle]}>
        {children}
      </KeyboardAwareScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>{footer}</View> : null}
    </View>
  );
}

export function Headline({ children }: { children: ReactNode }) {
  return (
    <AppText weight="medium" style={styles.headline}>
      {children}
    </AppText>
  );
}

/** Two-line headline where the second line is the orange thought. */
export function SplitHeadline({ first, second }: { first: string; second: string }) {
  return (
    <AppText weight="medium" style={styles.headline}>
      {first}
      {'\n'}
      <AppText inline weight="medium" style={[styles.headline, { color: colors.orangeOnDark }]}>
        {second}
      </AppText>
    </AppText>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return <AppText style={styles.lede}>{children}</AppText>;
}

/** Underline field: uppercase label, big value, rule that turns orange when focused. */
export function UnderlineField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  right,
  hint,
  optional,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secure?: boolean;
  right?: ReactNode;
  hint?: string;
  optional?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  textContentType?: React.ComponentProps<typeof TextInput>['textContentType'];
  returnKeyType?: React.ComponentProps<typeof TextInput>['returnKeyType'];
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  error?: string | null;
}) {
  const [focused, setFocused] = useState(false);
  const accent = error ? colors.dangerOnInk : focused ? colors.orange : undefined;
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <AppText weight="semibold" style={[styles.fieldLabel, accent ? { color: accent } : null]}>
          {label.toUpperCase()}
        </AppText>
        {optional ? <AppText style={styles.fieldOptional}>optional</AppText> : null}
      </View>
      <View style={styles.fieldRow}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(243,239,231,0.35)"
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.orange}
          style={styles.fieldInput}
          accessibilityLabel={label}
        />
        {right ? right : hint ? <AppText style={styles.fieldHint}>{hint}</AppText> : null}
      </View>
      <View style={[styles.fieldRule, accent ? { backgroundColor: accent, height: 1.5 } : null]} />
      {error ? <AppText style={styles.fieldError}>{error}</AppText> : null}
    </View>
  );
}

export function TextAccessory({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
      <AppText weight="semibold" style={styles.accessory}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Four bars + a verdict, from length and variety. */
export function PasswordStrength({ password }: { password: string }) {
  const score = !password
    ? 0
    : [password.length >= 8, /[A-Z]/.test(password) || /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password) || password.length >= 12, password.length >= 10].filter(Boolean).length;
  const verdict = !password ? '' : password.length < 8 ? 'Too short' : score >= 3 ? 'Strong enough' : 'Could be stronger';
  const color = password.length < 8 ? colors.dangerOnInk : colors.successOnInk;
  return (
    <View style={styles.strengthRow}>
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.strengthBar, i < score && { backgroundColor: color }]} />
        ))}
      </View>
      {verdict ? (
        <AppText weight="medium" style={[styles.strengthLabel, { color }]}>
          {verdict}
        </AppText>
      ) : null}
    </View>
  );
}

/** The one orange thing to press: label left, darker tile with the arrow right. */
export function PrimaryButton({
  label,
  onPress,
  icon = 'arrow-forward',
  caption,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  caption?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  return (
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!off, busy: !!loading }}
        disabled={off}
        onPress={onPress}
        style={({ pressed }) => [styles.primary, off && { opacity: 0.55 }, pressed && { opacity: 0.9 }]}
      >
        <AppText weight="semibold" numberOfLines={1} style={styles.primaryLabel}>
          {label}
        </AppText>
        <View style={styles.primaryTrail}>{loading ? <ActivityIndicator color="#FFF6EE" /> : <Ionicons name={icon} size={17} color="#FFF6EE" />}</View>
      </Pressable>
      {caption ? <AppText style={styles.caption}>{caption}</AppText> : null}
    </View>
  );
}

/** Transparent outline button on ink (Google, secondary actions). */
export function OutlineButton({ label, onPress, icon, loading, disabled }: { label: string; onPress: () => void; icon?: ReactNode; loading?: boolean; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.outline, (disabled || loading) && { opacity: 0.55 }, pressed && { opacity: 0.85 }]}
    >
      {loading ? <ActivityIndicator color={colors.onInk} /> : icon}
      <AppText weight="semibold" style={styles.outlineLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** "Been here before? Sign in" footer line. */
export function FooterLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.footerLine}>
      <AppText style={styles.footerPrompt}>{prompt} </AppText>
      <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
        <AppText weight="semibold" style={styles.footerAction}>
          {action}
        </AppText>
      </Pressable>
    </View>
  );
}

/** Six code boxes over one hidden input; the active box shows an orange caret. */
export function CodeBoxes({ value, onChange, length = 6, autoFocus = true }: { value: string; onChange: (v: string) => void; length?: number; autoFocus?: boolean }) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 250);
  }, [autoFocus]);
  return (
    <Pressable accessibilityRole="none" onPress={() => ref.current?.focus()} style={styles.codeRow}>
      {Array.from({ length }).map((_, i) => {
        const digit = value[i];
        const active = focused && i === Math.min(value.length, length - 1) && value.length < length;
        return (
          <View key={i} style={[styles.codeBox, active && styles.codeBoxActive]}>
            {digit ? (
              <AppText weight="semibold" style={styles.codeDigit}>
                {digit}
              </AppText>
            ) : active ? (
              <View style={styles.caret} />
            ) : null}
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hiddenInput}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        accessibilityLabel="Verification code"
      />
    </Pressable>
  );
}

/** Small lock strip on ink. */
export function InkStrip({ icon = 'lock-closed', text }: { icon?: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.inkStrip}>
      <Ionicons name={icon} size={15} color={colors.onInkMeta} />
      <AppText style={styles.inkStripText}>{text}</AppText>
    </View>
  );
}

export const inkStyles = {
  error: { marginTop: 16, fontSize: 13.5, lineHeight: 19, color: colors.dangerOnInk } as const,
  notice: { marginTop: 10, fontSize: 13, color: colors.successOnInkText } as const,
  link: { fontSize: 13.5, color: colors.orangeOnDark } as const,
  body: { fontSize: 14.5, color: colors.onInkBody } as const,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.inkWarm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingBottom: 14, minHeight: 40 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(243,239,231,0.22)' },
  kicker: { fontSize: 11, letterSpacing: 1.8, color: colors.orangeOnDark },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 8 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 12, backgroundColor: colors.inkWarm },
  headline: { fontSize: 34, lineHeight: 38, letterSpacing: -1.4, color: colors.onInk },
  lede: { marginTop: 10, fontSize: 15, lineHeight: 22, color: colors.onInkBody },
  field: { marginTop: 22 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  fieldLabel: { fontSize: 11, letterSpacing: 1.3, color: colors.onInkMeta },
  fieldOptional: { fontSize: 11.5, color: colors.onInkMeta },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  fieldInput: { flex: 1, fontFamily: fonts.medium, fontSize: 19, color: colors.onInk, paddingVertical: 8, paddingHorizontal: 0 },
  fieldHint: { fontSize: 12.5, color: colors.onInkMeta },
  fieldRule: { height: 1, backgroundColor: colors.onInkRule },
  fieldError: { marginTop: 6, fontSize: 12.5, color: colors.dangerOnInk },
  accessory: { fontSize: 13.5, color: colors.orangeOnDark },
  strengthRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 6 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.onInkFillStrong },
  strengthLabel: { fontSize: 12.5 },
  primary: {
    height: 56,
    borderRadius: 16,
    paddingLeft: 20,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.orange,
    shadowColor: colors.orange,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  primaryLabel: { flexShrink: 1, fontSize: 16, letterSpacing: -0.3, color: colors.orangeInk },
  primaryTrail: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34,16,4,0.28)' },
  caption: { marginTop: 10, textAlign: 'center', fontSize: 12.5, lineHeight: 17, color: colors.onInkMeta },
  outline: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(243,239,231,0.28)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  outlineLabel: { fontSize: 15.5, letterSpacing: -0.2, color: colors.onInk },
  footerLine: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  footerPrompt: { fontSize: 13.5, color: colors.onInkMeta },
  footerAction: { fontSize: 13.5, color: colors.onInk },
  codeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  codeBox: { flex: 1, height: 60, borderRadius: 14, backgroundColor: colors.onInkFill, borderWidth: 1, borderColor: colors.onInkRule, alignItems: 'center', justifyContent: 'center' },
  codeBoxActive: { borderColor: colors.orange, borderWidth: 1.5 },
  codeDigit: { fontSize: 24, color: colors.onInk },
  caret: { width: 2, height: 26, borderRadius: 1, backgroundColor: colors.orange },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  inkStrip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, borderRadius: 14, backgroundColor: colors.onInkFill, borderWidth: 1, borderColor: colors.onInkRule },
  inkStripText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: colors.onInkBody },
});
