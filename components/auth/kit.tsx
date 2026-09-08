import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
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
import { isAxiosError } from 'axios';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts } from '@/constants/colors';

/*
 * Customer auth kit, from "Servika 02 Sign-in v2": warm ink screens, cream
 * type, underline fields, digits typed straight onto the page, and one orange
 * bar to press with a darker tile carrying the arrow. A faint woven texture
 * sits behind the type; a sharper strip sits on the lip of the sign-in sheet.
 */

/** Faint crossing-line weave behind full screens. */
export function Weave({ opacity = 1 }: { opacity?: number }) {
  const { width, height } = useWindowDimensions();
  const w = Math.max(width, 320);
  const h = Math.max(height, 600);
  const vLines = Math.ceil(w / 11);
  const dLines = Math.ceil((w + h) / 13);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg width={w} height={h}>
        {Array.from({ length: vLines }).map((_, i) => (
          <Line key={`v${i}`} x1={i * 11} y1={0} x2={i * 11} y2={h} stroke="rgba(20,23,27,0.055)" strokeWidth={1} />
        ))}
        {Array.from({ length: dLines }).map((_, i) => (
          <Line key={`d${i}`} x1={i * 13 - h} y1={h} x2={i * 13} y2={0} stroke="rgba(20,23,27,0.04)" strokeWidth={1} />
        ))}
      </Svg>
    </View>
  );
}

/** Aso oke style strip for the lip of a sheet. */
export function WovenStrip({ style }: { style?: StyleProp<ViewStyle> }) {
  const { width } = useWindowDimensions();
  const w = Math.max(width, 320);
  return (
    <View pointerEvents="none" style={[{ height: 12 }, style]}>
      <Svg width={w} height={12}>
        {Array.from({ length: Math.ceil(w / 9) }).map((_, i) => (
          <Line key={`a${i}`} x1={i * 9} y1={0} x2={i * 9} y2={12} stroke="rgba(20,23,27,0.18)" strokeWidth={1.5} />
        ))}
        {Array.from({ length: Math.ceil(w / 11) + 2 }).map((_, i) => (
          <Line key={`b${i}`} x1={i * 11 - 12} y1={12} x2={i * 11} y2={0} stroke="rgba(228,98,10,0.5)" strokeWidth={1.5} />
        ))}
      </Svg>
    </View>
  );
}

/** Two segment progress rule with a small-caps label ("STEP 1"). */
export function StepRule({ label, progress }: { label: string; progress: 0.5 | 1 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 600, delay: 150, easing: Easing.bezier(0.22, 0.68, 0.24, 1), useNativeDriver: true }).start();
  }, [anim, progress]);
  return (
    <View style={styles.stepRow}>
      <AppText weight="semibold" style={styles.kicker}>{label.toUpperCase()}</AppText>
      <View style={styles.stepTrack}>
        <Animated.View style={[styles.stepFill, { width: `${progress * 100}%`, transform: [{ scaleX: anim }] }]} />
      </View>
    </View>
  );
}

export function AuthScreen({
  kicker,
  right,
  back = true,
  onBack,
  children,
  footer,
  banner,
  contentStyle,
}: {
  kicker?: string;
  /** Replaces the kicker on the right of the top row (e.g. a StepRule). */
  right?: ReactNode;
  back?: boolean;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Full-width notice under the status bar (the offline banner). */
  banner?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')));
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={{ paddingTop: insets.top + 6 }}>
        {banner ? <View style={styles.bannerWrap}>{banner}</View> : null}
        <View style={styles.topRow}>
          {back ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={goBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={18} color={colors.onInk} />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          {right ?? (kicker ? <AppText weight="semibold" style={styles.kicker}>{kicker.toUpperCase()}</AppText> : null)}
        </View>
      </View>
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, contentStyle]}>
        {children}
      </KeyboardAwareScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 18) + 6 }]}>{footer}</View> : null}
    </View>
  );
}

export function Headline({ children, compact }: { children: ReactNode; compact?: boolean }) {
  return (
    <AppText weight="medium" style={compact ? styles.headlineCompact : styles.headline}>
      {children}
    </AppText>
  );
}

export function Lede({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <AppText style={[styles.lede, style as never]}>{children}</AppText>;
}

/** Underline field: small-caps label, cream value, one rule that turns orange when active. */
export function UnderlineField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  right,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  onFocus,
  onBlur,
  inputRef,
  tone = 'normal',
  editable = true,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secure?: boolean;
  right?: ReactNode;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete'];
  textContentType?: React.ComponentProps<typeof TextInput>['textContentType'];
  returnKeyType?: React.ComponentProps<typeof TextInput>['returnKeyType'];
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  tone?: 'normal' | 'error';
  editable?: boolean;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const accent = tone === 'error' ? colors.dangerRule : focused ? colors.orange : undefined;
  const labelColor = tone === 'error' ? colors.dangerOnInk : focused ? colors.orange : colors.onInkBody;
  return (
    <View style={styles.field}>
      <AppText weight="semibold" style={[styles.fieldLabel, { color: labelColor }]}>{label.toUpperCase()}</AppText>
      <View style={styles.fieldRow}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(20,23,27,0.3)"
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          selectionColor={colors.orange}
          editable={editable}
          autoFocus={autoFocus}
          style={[styles.fieldInput, tone === 'error' && { color: colors.dangerOnInk }, secure && value ? { letterSpacing: 3 } : null]}
          accessibilityLabel={label}
        />
        {right}
      </View>
      <View style={[styles.fieldRule, accent ? { backgroundColor: accent, height: 1.5 } : null]} />
    </View>
  );
}

export function TextAccessory({ label, onPress, tone = 'orange' }: { label: string; onPress: () => void; tone?: 'orange' | 'quiet' }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
      <AppText weight="semibold" style={[styles.accessory, tone === 'quiet' && { color: colors.onInkMeta }]}>{label}</AppText>
    </Pressable>
  );
}

export type PasswordCheck = { ok: boolean; label: string };
/** The design's rule: eight characters, one number, not your name or email. */
export function passwordChecks(password: string, name: string, email: string): PasswordCheck[] {
  const lower = password.toLowerCase();
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  const nameParts = name.toLowerCase().split(/\s+/).filter((p) => p.length >= 3);
  const personal = (local.length >= 3 && lower.includes(local)) || nameParts.some((p) => lower.includes(p));
  return [
    { ok: password.length >= 8, label: 'At least eight characters' },
    { ok: /\d/.test(password), label: 'One number anywhere' },
    { ok: password.length > 0 && !personal, label: 'Not your email or your name' },
  ];
}
export function passwordPasses(checks: PasswordCheck[]) {
  return checks.every((c) => c.ok);
}

/** Three segment strength rule with a verdict, plus the checklist when asked. */
export function PasswordStrength({ password, checks, showChecklist }: { password: string; checks: PasswordCheck[]; showChecklist?: boolean }) {
  const passed = checks.filter((c) => c.ok).length;
  const strong = passed === 3 && (/[^A-Za-z0-9]/.test(password) || password.length >= 12);
  const segments = !password ? 0 : passed < 3 ? 1 : strong ? 3 : 2;
  const failing = passed < 3 && password.length > 0;
  const verdict = !password
    ? 'Eight characters and a number keeps it out of reach.'
    : failing
      ? `${password.length < 8 ? `${['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][password.length] ?? password.length} characters` : 'Eight characters'}${/\d/.test(password) ? '' : ', no number'}`
      : strong
        ? 'Strong. That one will hold.'
        : 'Decent. A symbol makes it strong.';
  const color = failing ? colors.dangerOnInk : segments >= 2 ? colors.onInkBody : colors.onInkFaint;
  const barColor = failing ? colors.dangerRule : colors.orange;
  return (
    <View style={{ paddingTop: 12 }}>
      {password ? (
        <View style={styles.strengthRow}>
          <View style={styles.strengthBars}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.strengthBar, i < segments && { backgroundColor: barColor }]} />
            ))}
          </View>
          <AppText weight="semibold" style={[styles.strengthLabel, { color }]}>{verdict}</AppText>
        </View>
      ) : (
        <AppText style={[styles.strengthLabel, { color }]}>{verdict}</AppText>
      )}
      {showChecklist ? (
        <View style={styles.checklist}>
          {checks.map((c) => (
            <View key={c.label} style={styles.checkRow}>
              <View style={[styles.checkDot, { backgroundColor: c.ok ? 'rgba(228,98,10,0.14)' : 'rgba(229,72,77,0.12)' }]}>
                <AppText weight="semibold" style={{ fontSize: 10, color: c.ok ? colors.orangeOnDark : colors.dangerOnInk }}>{c.ok ? '✓' : '✕'}</AppText>
              </View>
              <AppText style={styles.checkLabel}>{c.label}</AppText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** The one orange thing to press. `loading` dims the bar and puts a spinner in the tile. */
export function PrimaryButton({
  label,
  loadingLabel,
  onPress,
  icon = 'arrow-forward',
  disabled,
  loading,
  style,
}: {
  label: string;
  loadingLabel?: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled && !loading;
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.primary, loading ? { backgroundColor: colors.orangeBusy } : null, off ? styles.primaryOff : null, pressed && !off ? styles.pressed : null, style]}
    >
      <AppText weight="semibold" numberOfLines={1} style={[styles.primaryLabel, off && { color: 'rgba(255,246,238,0.6)' }]}>
        {loading && loadingLabel ? loadingLabel : label}
      </AppText>
      <View style={[styles.primaryTrail, off && { backgroundColor: 'rgba(23,20,15,0.18)' }]}>
        {loading ? <ActivityIndicator color={colors.orangeLabel} /> : <Ionicons name={icon} size={18} color={off ? 'rgba(255,246,238,0.6)' : colors.orangeLabel} />}
      </View>
    </Pressable>
  );
}

/** Transparent outline bar on ink. `trailing` adds the tile with an icon. */
export function OutlineButton({ label, onPress, icon, trailing, loading, disabled }: { label: string; onPress: () => void; icon?: ReactNode; trailing?: React.ComponentProps<typeof Ionicons>['name']; loading?: boolean; disabled?: boolean }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[styles.outline, trailing ? styles.outlineTrailing : null, disabled || loading ? { opacity: 0.55 } : null, pressed ? styles.pressed : null]}
    >
      {loading ? <ActivityIndicator color={colors.onInk} /> : icon}
      <AppText weight="semibold" style={styles.outlineLabel}>{label}</AppText>
      {trailing ? (
        <View style={styles.outlineTile}>
          <Ionicons name={trailing} size={17} color={colors.onInk} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function FooterLink({ prompt, action, onPress }: { prompt?: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.footerLine}>
      {prompt ? <AppText style={styles.footerPrompt}>{prompt} </AppText> : null}
      <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress}>
        <AppText weight={prompt ? 'semibold' : 'medium'} style={prompt ? styles.footerAction : styles.footerQuiet}>{action}</AppText>
      </Pressable>
    </View>
  );
}

/**
 * Six digits typed straight onto the page: a landed digit springs in, the
 * active slot carries the caret, empty slots are short dashes. Tone paints the
 * whole row (wrong = red, dim = spent).
 */
export function CodeDigits({ value, onChange, length = 6, tone = 'normal', autoFocus = true, editable = true }: { value: string; onChange: (v: string) => void; length?: number; tone?: 'normal' | 'wrong' | 'dim'; autoFocus?: boolean; editable?: boolean }) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 250);
  }, [autoFocus]);
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(blink, { toValue: 0, duration: 500, useNativeDriver: true }), Animated.timing(blink, { toValue: 1, duration: 500, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [blink]);
  const color = tone === 'wrong' ? colors.dangerOnInk : colors.onInk;
  return (
    <Pressable accessibilityRole="none" onPress={() => editable && ref.current?.focus()} style={[styles.codeRow, tone === 'dim' && { opacity: 0.3 }]}>
      {Array.from({ length }).map((_, i) => {
        const digit = value[i];
        const active = editable && focused && i === value.length && value.length < length;
        return (
          <View key={i} style={styles.codeSlot}>
            {digit ? (
              <Digit char={digit} color={color} />
            ) : active ? (
              <Animated.View style={[styles.caret, { opacity: blink }]} />
            ) : (
              <View style={styles.dash} />
            )}
          </View>
        );
      })}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        editable={editable}
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

function Digit({ char, color }: { char: string; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.bezier(0.22, 0.68, 0.24, 1), useNativeDriver: true }).start();
  }, [anim]);
  return (
    <Animated.Text style={[styles.digit, { color, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }, { scale: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.7, 1.08, 1] }) }] }]}>
      {char}
    </Animated.Text>
  );
}

/** "A new one in 0:45" + the Paste from mail pill. */
export function ResendRow({ cooldown, onResend, onPaste, length = 6 }: { cooldown: number; onResend: () => void; onPaste: (code: string) => void; length?: number }) {
  const paste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const match = text.replace(/\D/g, '').slice(0, length);
      if (match.length === length) onPaste(match);
    } catch {
      // clipboard unavailable
    }
  };
  return (
    <View style={styles.resendRow}>
      {cooldown > 0 ? (
        <AppText style={styles.resend}>
          A new one in <AppText inline weight="semibold" style={styles.resendStrong}>0:{String(cooldown).padStart(2, '0')}</AppText>
        </AppText>
      ) : (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onResend}>
          <AppText weight="semibold" style={styles.resendLink}>Send a new one</AppText>
        </Pressable>
      )}
      <Pressable accessibilityRole="button" onPress={paste} style={styles.pastePill}>
        <Ionicons name="clipboard-outline" size={13} color={colors.onInk} />
        <AppText weight="semibold" style={styles.pasteLabel}>Paste from mail</AppText>
      </Pressable>
    </View>
  );
}

export function Rule({ tone = 'normal' }: { tone?: 'normal' | 'wrong' }) {
  return <View style={[styles.rule, tone === 'wrong' && { height: 1.5, backgroundColor: colors.dangerRule }]} />;
}

/** Red notice under the status bar: "No network. Your code never left." */
export function Banner({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerDot} />
      <AppText weight="medium" style={styles.bannerText}>{text}</AppText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction}>
          <AppText weight="semibold" style={styles.bannerAction}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** The orange tick tile that opens the "you are in" screens. */
export function CheckTile() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, easing: Easing.bezier(0.22, 0.68, 0.24, 1), useNativeDriver: true }).start();
  }, [anim]);
  return (
    <Animated.View style={[styles.checkTile, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.86, 1.03, 1] }) }] }]}>
      <Ionicons name="checkmark" size={30} color={colors.orangeLabel} />
    </Animated.View>
  );
}

/** Full-screen "Talking to Google" while the account chooser hands back. */
export function GoogleInFlight({ visible }: { visible: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [visible, spin]);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.googleRoot}>
        <View style={styles.googleRing}>
          <Animated.View style={[styles.googleSpinner, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />
          <View style={styles.googleG}>
            <AppText weight="semibold" style={{ fontSize: 17, color: colors.onInk }}>G</AppText>
          </View>
        </View>
        <AppText weight="medium" style={styles.googleTitle}>Talking to Google</AppText>
        <AppText style={styles.googleBody}>Getting your name and email back. No password ever passes through us.</AppText>
      </View>
    </Modal>
  );
}

/** How an auth request failed, so screens can show the right state instead of a generic line. */
export type AuthFailure = { kind: 'offline' | 'conflict' | 'invalid' | 'rate' | 'unauthorized' | 'other'; message: string };
export function classifyAuthError(error: unknown, fallback = 'Something went wrong. Try again.'): AuthFailure {
  if (isAxiosError(error)) {
    if (!error.response) return { kind: 'offline', message: 'No network. Nothing you typed is lost.' };
    const data = error.response.data as { title?: string; detail?: string } | undefined;
    const message = data?.title ?? data?.detail ?? fallback;
    const s = error.response.status;
    if (s === 409) return { kind: 'conflict', message };
    if (s === 429) return { kind: 'rate', message };
    if (s === 401 || s === 403) return { kind: 'unauthorized', message };
    if (s === 400) return { kind: 'invalid', message };
    return { kind: 'other', message };
  }
  return { kind: 'other', message: fallback };
}

export const inkStyles = {
  error: { marginTop: 14, fontSize: 13.5, lineHeight: 19, color: colors.dangerOnInk } as const,
  notice: { marginTop: 10, fontSize: 13, color: colors.amberOnInk } as const,
  link: { fontSize: 13.5, color: colors.orangeOnDark } as const,
  body: { fontSize: 13, color: colors.onInkMeta } as const,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.inkWarm },
  bannerWrap: { paddingHorizontal: 22, paddingBottom: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 10, minHeight: 48 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(20,23,27,0.2)' },
  kicker: { fontSize: 11, letterSpacing: 1.8, color: colors.onInkBody },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  stepTrack: { width: 58, height: 2, backgroundColor: colors.onInkRule, overflow: 'hidden' },
  stepFill: { height: 2, backgroundColor: colors.orange, transformOrigin: 'left' },
  content: { paddingHorizontal: 26, paddingTop: 30, paddingBottom: 32 },
  footer: { paddingHorizontal: 26, paddingTop: 14, gap: 14, backgroundColor: colors.inkWarm },
  headline: { fontSize: 38, lineHeight: 40, letterSpacing: -1.9, color: colors.onInk },
  headlineCompact: { fontSize: 26, lineHeight: 28, letterSpacing: -1, color: colors.onInk },
  lede: { marginTop: 13, maxWidth: 300, fontSize: 14.5, lineHeight: 23, color: colors.onInkBody },
  field: { paddingTop: 16 },
  fieldLabel: { fontSize: 11, letterSpacing: 1.76, marginBottom: 2 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  fieldInput: { flex: 1, fontFamily: fonts.medium, fontSize: 18.5, letterSpacing: -0.3, color: colors.onInk, paddingVertical: 6, paddingHorizontal: 0 },
  fieldRule: { marginTop: 8, height: 1, backgroundColor: colors.onInkRule },
  accessory: { fontSize: 13, color: colors.orange },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthBars: { flexDirection: 'row', gap: 5 },
  strengthBar: { width: 34, height: 3, borderRadius: 99, backgroundColor: 'rgba(20,23,27,0.18)' },
  strengthLabel: { flex: 1, fontSize: 12.5, lineHeight: 17 },
  checklist: { gap: 9, paddingTop: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { fontSize: 13.5, color: 'rgba(20,23,27,0.7)' },
  primary: { height: 62, borderRadius: 18, paddingLeft: 24, paddingRight: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: colors.orange },
  primaryOff: { backgroundColor: 'rgba(228,98,10,0.35)' },
  pressed: { transform: [{ translateY: 1 }, { scale: 0.995 }] },
  primaryLabel: { flexShrink: 1, fontSize: 16, letterSpacing: -0.3, color: colors.orangeLabel },
  primaryTrail: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(23,20,15,0.22)' },
  outline: { height: 58, borderRadius: 18, borderWidth: 1, borderColor: colors.onInkBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  outlineTrailing: { height: 62, justifyContent: 'space-between', paddingLeft: 24, paddingRight: 8 },
  outlineTile: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,23,27,0.12)' },
  outlineLabel: { fontSize: 15.5, letterSpacing: -0.3, color: colors.onInk },
  footerLine: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 36 },
  footerPrompt: { fontSize: 13.5, color: colors.onInkMeta },
  footerAction: { fontSize: 13.5, color: colors.onInk },
  footerQuiet: { fontSize: 13.5, color: colors.onInkMeta },
  codeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, height: 44 },
  codeSlot: { width: 26, alignItems: 'center', justifyContent: 'flex-end', height: 44 },
  digit: { fontFamily: fonts.medium, fontSize: 36, lineHeight: 42, letterSpacing: -1.4 },
  caret: { width: 2, height: 34, backgroundColor: colors.orange, marginBottom: 4 },
  dash: { width: 20, height: 1.5, backgroundColor: 'rgba(20,23,27,0.28)', marginBottom: 12 },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  resend: { fontSize: 13.5, color: colors.onInkMeta },
  resendStrong: { fontSize: 13.5, color: colors.onInk },
  resendLink: { fontSize: 13.5, color: colors.orangeOnDark },
  pastePill: { height: 34, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(20,23,27,0.22)', flexDirection: 'row', alignItems: 'center', gap: 7 },
  pasteLabel: { fontSize: 12.5, color: colors.onInk },
  rule: { height: 1, backgroundColor: 'rgba(20,23,27,0.14)' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 16, backgroundColor: 'rgba(229,72,77,0.08)', borderWidth: 1, borderColor: 'rgba(229,72,77,0.35)' },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dangerRule },
  bannerText: { flex: 1, fontSize: 13, color: '#B3261E' },
  bannerAction: { fontSize: 13, color: colors.orangeOnDark },
  checkTile: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  googleRoot: { flex: 1, backgroundColor: colors.inkWarm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 26 },
  googleRing: { width: 74, height: 74, alignItems: 'center', justifyContent: 'center' },
  googleSpinner: { position: 'absolute', width: 74, height: 74, borderRadius: 37, borderWidth: 2, borderColor: 'rgba(20,23,27,0.16)', borderTopColor: colors.orange },
  googleG: { width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, borderColor: colors.onInk, alignItems: 'center', justifyContent: 'center' },
  googleTitle: { fontSize: 28, lineHeight: 30, letterSpacing: -1.1, color: colors.onInk, textAlign: 'center' },
  googleBody: { marginTop: -12, maxWidth: 260, textAlign: 'center', fontSize: 14, lineHeight: 22, color: colors.onInkBody },
});
