import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { AuthScreen, FooterLink, inkStyles, Lede, PrimaryButton, SplitHeadline, TextAccessory, UnderlineField } from '@/components/auth/kit';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { AppText } from '@/components/ui/AppText';
import { authErrorMessage, login } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

/** Returning sign-in (design 10b): the same underline grammar, one thing to press. */
export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    if (submitting) return;
    const emailOrPhone = identifier.trim();
    if (!emailOrPhone || !password) return setError('Enter your email or phone, and your password.');
    setError(null);
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
      setError(authErrorMessage(e, 'That email or phone and password do not match.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      kicker="Signing back in"
      footer={
        <>
          <PrimaryButton label="Sign me in" loading={submitting} onPress={submit} />
          <GoogleAuthButton variant="dark" />
          <FooterLink prompt="New here?" action="Make an account" onPress={() => router.replace('/register')} />
        </>
      }
    >
      <SplitHeadline first="Good to have" second="you back." />
      <Lede>Sign in to see your bookings and pick up any chat where you left it.</Lede>

      <UnderlineField
        label="Email or phone"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <UnderlineField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secure={!show}
        autoComplete="password"
        inputRef={passwordRef}
        returnKeyType="done"
        onSubmitEditing={submit}
        right={<TextAccessory label={show ? 'Hide' : 'Show'} onPress={() => setShow((v) => !v)} />}
      />
      <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/forgot-password')} style={styles.forgot}>
        <AppText style={inkStyles.body}>Forgot it? We will email you a code</AppText>
      </Pressable>

      {error ? <AppText style={inkStyles.error}>{error}</AppText> : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: { marginTop: 14, alignSelf: 'flex-start' },
});
