import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, StyleSheet, TextInput } from 'react-native';

import { AuthScreen, FooterLink, inkStyles, Lede, PasswordStrength, PrimaryButton, SplitHeadline, TextAccessory, UnderlineField } from '@/components/auth/kit';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { authErrorMessage, register } from '@/lib/api/auth';

/**
 * Create account (design 11). Name, email and a password: nothing else. The
 * phone number is asked later, the first time it matters (booking or chat),
 * so signing up stays a one-minute job. The code goes to the email.
 */
export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    if (submitting) return;
    const name = fullName.trim();
    const emailValue = email.trim().toLowerCase();
    if (name.length < 2) return setError('Tell us your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) return setError('Enter a valid email. Your code goes there.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setError(null);
    setSubmitting(true);
    try {
      const { email: registered } = await register({ fullName: name, email: emailValue, password });
      router.push({ pathname: '/verify', params: { email: registered, flow: 'register' } });
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreen
      kicker="Making an account"
      footer={
        <>
          <PrimaryButton label="Send me the code" loading={submitting} onPress={submit} caption="A six-digit code lands in your email. Nothing else is sent." />
          <GoogleAuthButton variant="dark" />
          <FooterLink prompt="Been here before?" action="Sign in" onPress={() => router.replace('/login')} />
        </>
      }
    >
      <SplitHeadline first="A name, an email," second="and you are in." />
      <Lede>Look at prices all day without an account. To book or chat, artisans need to know who is asking.</Lede>

      <UnderlineField
        label="Your name"
        value={fullName}
        onChangeText={setFullName}
        placeholder="What artisans should call you"
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <UnderlineField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        hint="We email a code"
        inputRef={emailRef}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <UnderlineField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secure={!show}
        autoComplete="new-password"
        inputRef={passwordRef}
        returnKeyType="done"
        onSubmitEditing={submit}
        right={<TextAccessory label={show ? 'Hide' : 'Show'} onPress={() => setShow((v) => !v)} />}
      />
      <PasswordStrength password={password} />

      {error ? <AppText style={inkStyles.error}>{error}</AppText> : null}
      <AppText style={styles.consent}>
        By continuing you agree to the Servika{' '}
        <AppText inline weight="semibold" style={styles.consentLink} onPress={() => Linking.openURL('https://servika.com.ng/terms').catch(() => {})}>
          terms
        </AppText>{' '}
        and{' '}
        <AppText inline weight="semibold" style={styles.consentLink} onPress={() => Linking.openURL('https://servika.com.ng/privacy').catch(() => {})}>
          privacy policy
        </AppText>
        . Your phone number is only asked when a booking needs it.
      </AppText>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  consent: { marginTop: 18, fontSize: 12, lineHeight: 17, color: colors.onInkMeta },
  consentLink: { fontSize: 12, color: colors.onInk },
});
