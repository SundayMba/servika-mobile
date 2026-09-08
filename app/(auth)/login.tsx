import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AuthScreen, Banner, classifyAuthError, FooterLink, GoogleInFlight, Headline, inkStyles, Lede, PrimaryButton, TextAccessory, UnderlineField } from '@/components/auth/kit';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { clearLastAccount, getLastAccount, lastSeenLabel, type LastAccount } from '@/lib/auth/lastAccount';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? '').join('').toUpperCase();
}

/**
 * Sign in (design 10b). A returning client gets the short way back in: face,
 * name, the email already filled, only the password to type. "Not you?" opens
 * the plain form. Google stays; email verification resumes if it never finished.
 */
export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [last, setLast] = useState<LastAccount | null | undefined>(undefined);
  const [identifier, setIdentifier] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    void getLastAccount().then((a) => {
      setLast(a);
      if (a && !params.email) setIdentifier(a.email);
    });
  }, [params.email]);

  const returning = !!last && identifier.toLowerCase() === last.email.toLowerCase();

  const notYou = async () => {
    await clearLastAccount();
    setLast(null);
    setIdentifier('');
    setPassword('');
  };

  const submit = async () => {
    if (submitting) return;
    const emailOrPhone = identifier.trim();
    if (!emailOrPhone || !password) return setError('Your email and your password, then we are in.');
    setError(null);
    setOffline(false);
    setSubmitting(true);
    try {
      const res = await login({ emailOrPhone, password });
      if (res.session) {
        await signIn(res.session);
        router.dismissAll();
        router.replace('/home');
      } else if (res.verificationRequired) {
        // The account exists but the email was never confirmed: finish that step.
        router.push({ pathname: '/verify', params: { email: res.email, flow: 'login' } });
      }
    } catch (e) {
      const f = classifyAuthError(e, 'That email and password do not match.');
      if (f.kind === 'offline') setOffline(true);
      else if (f.kind === 'unauthorized') setError(f.message === 'Invalid email/phone or password.' ? 'That password does not match this email. Try again, or reset it.' : f.message);
      else setError(f.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (last === undefined) return <AuthScreen kicker="Signing back in">{null}</AuthScreen>;

  return (
    <AuthScreen
      kicker="Signing back in"
      banner={offline ? <Banner text="No network. Nothing you typed is lost." actionLabel="Retry" onAction={submit} /> : null}
      footer={
        <>
          <PrimaryButton label="Sign me in" loadingLabel="Signing you in" loading={submitting} onPress={submit} />
          <GoogleAuthButton variant="dark" onBusyChange={setGoogleBusy} />
          <FooterLink prompt="New here?" action="Make an account" onPress={() => router.replace('/register')} />
        </>
      }
    >
      {returning && last ? (
        <View style={styles.welcome}>
          <View style={styles.avatar}>
            <AppText weight="semibold" style={styles.avatarText}>{initials(last.fullName)}</AppText>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <AppText weight="medium" style={styles.welcomeTitle}>Welcome back, {last.fullName.split(/\s+/)[0]}.</AppText>
            <AppText style={inkStyles.body}>{lastSeenLabel(last.lastSeenUtc)}</AppText>
          </View>
        </View>
      ) : (
        <>
          <Headline>Good to have{'\n'}you back.</Headline>
          <Lede>Sign in to see your bookings and pick up any chat where you left it.</Lede>
        </>
      )}

      <View style={{ marginTop: returning ? 26 : 22 }}>
        {returning && last ? (
          <View style={styles.staticField}>
            <View style={{ flex: 1, gap: 6 }}>
              <AppText weight="semibold" style={styles.staticLabel}>EMAIL</AppText>
              <AppText weight="medium" style={styles.staticValue} numberOfLines={1}>{last.email}</AppText>
            </View>
            <TextAccessory label="Not you?" tone="quiet" onPress={() => void notYou()} />
          </View>
        ) : (
          <UnderlineField
            label="Email or phone"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            autoFocus={!identifier}
          />
        )}
        <UnderlineField
          label="Password"
          value={password}
          onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
          placeholder="Your password"
          secure={!show}
          autoComplete="password"
          inputRef={passwordRef}
          returnKeyType="done"
          onSubmitEditing={submit}
          autoFocus={returning}
          tone={error ? 'error' : 'normal'}
          right={<TextAccessory label={show ? 'Hide' : 'Show'} onPress={() => setShow((v) => !v)} />}
        />
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push({ pathname: '/forgot-password', params: identifier ? { email: identifier } : {} })} style={styles.forgot}>
          <AppText weight="semibold" style={styles.forgotText}>Forgot it? We will email you a code</AppText>
        </Pressable>
        {error ? <AppText style={inkStyles.error}>{error}</AppText> : null}
      </View>
      <GoogleInFlight visible={googleBusy} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  welcome: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.onInkFill, borderWidth: 1.5, borderColor: 'rgba(20,23,27,0.2)' },
  avatarText: { fontSize: 17, color: colors.onInk },
  welcomeTitle: { fontSize: 30, lineHeight: 32, letterSpacing: -1.3, color: colors.onInk },
  staticField: { paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.onInkRule, flexDirection: 'row', alignItems: 'center', gap: 12 },
  staticLabel: { fontSize: 11, letterSpacing: 1.76, color: colors.onInkBody },
  staticValue: { fontSize: 18.5, letterSpacing: -0.3, color: colors.onInk },
  forgot: { paddingTop: 14, alignSelf: 'flex-start' },
  forgotText: { fontSize: 13, color: colors.onInkMeta },
});
