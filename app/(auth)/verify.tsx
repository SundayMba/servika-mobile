import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthScreen, CodeBoxes, InkStrip, inkStyles, PrimaryButton, SplitHeadline } from '@/components/auth/kit';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { authErrorMessage, resendOtp, verifyOtp } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

/**
 * Six digits just landed (design 12). The code is emailed at registration (or
 * on an unverified sign-in), so the screen opens already in cooldown. The
 * sixth digit verifies at once; the button covers a slow keyboard.
 *
 * Params: `email`, `flow` = 'register' | 'login' (both land on Home).
 */
export default function Verify() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { email = '' } = useLocalSearchParams<{ email?: string; flow?: string }>();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submit = async (value: string) => {
    if (submitting || value.length < CODE_LENGTH) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await verifyOtp({ otpCode: value, otpType: 'account_verification', emailOrPhone: email });
      if (res.verified && res.accessToken && res.accessTokenExpiresAtUtc && res.refreshToken && res.user) {
        await signIn({
          accessToken: res.accessToken,
          accessTokenExpiresAtUtc: res.accessTokenExpiresAtUtc,
          refreshToken: res.refreshToken,
          user: res.user,
          verificationRequired: false,
        });
        router.dismissAll();
        router.replace('/home');
      } else {
        setError('That code is wrong or has expired.');
        setCode('');
      }
    } catch (e) {
      setError(authErrorMessage(e, 'That code is wrong or has expired.'));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = (v: string) => {
    setCode(v);
    if (error) setError(null);
    if (v.length === CODE_LENGTH) void submit(v);
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setNotice(null);
    try {
      await resendOtp({ emailOrPhone: email, otpType: 'account_verification' });
      setNotice('A new code is on its way.');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  const remaining = CODE_LENGTH - code.length;
  const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

  return (
    <AuthScreen
      kicker="Confirming your email"
      footer={
        <PrimaryButton
          label={submitting ? 'Checking' : 'Verify'}
          disabled={remaining > 0}
          loading={submitting}
          onPress={() => submit(code)}
          caption={remaining > 0 ? `${words[remaining]} more ${remaining === 1 ? 'digit' : 'digits'} to go` : 'Checking your code'}
        />
      }
    >
      <SplitHeadline first="Six digits" second="just landed." />
      <View style={styles.sentRow}>
        <AppText style={inkStyles.body}>Sent to {email}. </AppText>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => (router.canGoBack() ? router.back() : router.replace('/register'))}>
          <AppText weight="semibold" style={styles.wrong}>Wrong address?</AppText>
        </Pressable>
      </View>

      <View style={{ marginTop: 26 }}>
        <CodeBoxes value={code} onChange={onChange} length={CODE_LENGTH} />
      </View>

      <View style={styles.resendRow}>
        {cooldown > 0 ? (
          <>
            <View style={styles.ring} />
            <AppText style={styles.resend}>Resend code in 0:{String(cooldown).padStart(2, '0')}</AppText>
          </>
        ) : (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={resend}>
            <AppText weight="semibold" style={inkStyles.link}>Resend the code</AppText>
          </Pressable>
        )}
      </View>
      {notice ? <AppText style={inkStyles.notice}>{notice}</AppText> : null}
      {error ? <AppText style={[inkStyles.error, { marginTop: 10 }]}>{error}</AppText> : null}

      <View style={{ flex: 1, minHeight: 80 }} />
      <InkStrip text="Your email is only used for codes and receipts. Artisans never see it." />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sentRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  wrong: { fontSize: 14.5, color: colors.onInk, textDecorationLine: 'underline' },
  resendRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  ring: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.orange, borderTopColor: 'rgba(243,239,231,0.2)' },
  resend: { fontSize: 13.5, color: colors.onInkBody },
});
