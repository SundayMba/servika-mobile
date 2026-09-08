import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthScreen, CodeBoxes, inkStyles, Lede, PasswordStrength, PrimaryButton, SplitHeadline, TextAccessory, UnderlineField } from '@/components/auth/kit';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { authErrorMessage, forgotPassword, resetPassword } from '@/lib/api/auth';

type Step = 'request' | 'reset';
const RESEND_COOLDOWN = 60;

/**
 * Lost password (designs 15 to 18). Step one asks where the account lives;
 * step two takes the six digits and the new password on one screen, then
 * hands back to sign-in.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const request = async () => {
    if (submitting) return;
    const emailOrPhone = identifier.trim();
    if (!emailOrPhone) return setError('Enter the email or phone on your account.');
    setError(null);
    setSubmitting(true);
    try {
      // Never reveals whether the account exists, so we always move on.
      await forgotPassword(emailOrPhone);
      setStep('reset');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = async () => {
    if (submitting) return;
    if (code.length < 6) return setError('Enter the six-digit code from your email.');
    if (password.length < 8) return setError('The new password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ emailOrPhone: identifier.trim(), tokenOrOtp: code, newPassword: password, confirmPassword: confirm });
      router.replace('/login');
    } catch (e) {
      setError(authErrorMessage(e, 'That code is wrong or has expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      await forgotPassword(identifier.trim());
      setNotice('A new code is on its way.');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  return (
    <AuthScreen
      kicker="Resetting your password"
      onBack={() => (step === 'reset' ? setStep('request') : router.canGoBack() ? router.back() : router.replace('/login'))}
      footer={
        step === 'request' ? (
          <PrimaryButton label="Email me a code" loading={submitting} onPress={request} caption="Nothing changes until you enter the code." />
        ) : (
          <PrimaryButton label="Save and sign in" loading={submitting} onPress={reset} />
        )
      }
    >
      {step === 'request' ? (
        <>
          <SplitHeadline first="Lost your" second="password?" />
          <Lede>Tell us where your account lives. We email a six-digit code you use to set a new one.</Lede>
          <UnderlineField
            label="Email or phone"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="username"
            returnKeyType="done"
            onSubmitEditing={request}
          />
        </>
      ) : (
        <>
          <SplitHeadline first="Set a" second="new one." />
          <Lede>The code went to {identifier.trim()}. It works for 30 minutes.</Lede>
          <View style={{ marginTop: 22 }}>
            <CodeBoxes value={code} onChange={setCode} />
          </View>
          <View style={styles.resendRow}>
            {cooldown > 0 ? (
              <AppText style={styles.resend}>Resend code in 0:{String(cooldown).padStart(2, '0')}</AppText>
            ) : (
              <Pressable accessibilityRole="button" hitSlop={8} onPress={resend}>
                <AppText weight="semibold" style={inkStyles.link}>Resend the code</AppText>
              </Pressable>
            )}
          </View>
          {notice ? <AppText style={inkStyles.notice}>{notice}</AppText> : null}
          <UnderlineField
            label="New password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            secure={!show}
            autoComplete="new-password"
            right={<TextAccessory label={show ? 'Hide' : 'Show'} onPress={() => setShow((v) => !v)} />}
          />
          <PasswordStrength password={password} />
          <UnderlineField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Same again" secure={!show} autoComplete="new-password" returnKeyType="done" onSubmitEditing={reset} />
        </>
      )}
      {error ? <AppText style={inkStyles.error}>{error}</AppText> : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  resendRow: { marginTop: 14 },
  resend: { fontSize: 13.5, color: colors.onInkBody },
});
