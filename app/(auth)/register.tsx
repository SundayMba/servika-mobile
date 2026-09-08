import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AuthScreen, Banner, classifyAuthError, FooterLink, GoogleInFlight, Headline, inkStyles, Lede, OutlineButton, passwordChecks, passwordPasses, PasswordStrength, PrimaryButton, StepRule, TextAccessory, UnderlineField } from '@/components/auth/kit';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { register } from '@/lib/api/auth';

const DOMAINS = ['@gmail.com', '@yahoo.com', '.ng'];

/**
 * Create account (design 11 and its three edges). Name, email, a password:
 * that is all. The phone is asked later, where it matters. Email taken offers
 * to sign in rather than reporting a bare error; a weak password becomes a
 * checklist that ticks as it is satisfied; with the keyboard up the headline
 * shrinks and a domain row docks above the keys.
 */
export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [taken, setTaken] = useState(false);
  const [weakAttempt, setWeakAttempt] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [focus, setFocus] = useState<'name' | 'email' | 'password' | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setKeyboardUp(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setKeyboardUp(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  const checks = useMemo(() => passwordChecks(password, fullName, email), [password, fullName, email]);
  const passes = passwordPasses(checks);
  const weak = weakAttempt && !passes;

  const addDomain = (d: string) => {
    const v = email.trim();
    if (d === '.ng') {
      if (!v.includes('@')) return;
      setEmail(v.endsWith('.ng') ? v : v.replace(/\.[a-z]+$/i, '') + (v.split('@')[1]?.includes('.') ? '.ng' : '.com.ng'));
      return;
    }
    setEmail(v.includes('@') ? v.replace(/@.*$/, d) : v + d);
  };

  const submit = async () => {
    if (submitting) return;
    const name = fullName.trim();
    const emailValue = email.trim().toLowerCase();
    if (name.length < 2) return setError('Your name first, the way artisans should say it.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) return setError('That does not look like an email. Your code goes there.');
    if (!passes) {
      setWeakAttempt(true);
      passwordRef.current?.focus();
      return;
    }
    setError(null);
    setOffline(false);
    setSubmitting(true);
    try {
      const { email: registered } = await register({ fullName: name, email: emailValue, password });
      router.push({ pathname: '/verify', params: { email: registered, flow: 'register', name } });
    } catch (e) {
      const f = classifyAuthError(e);
      if (f.kind === 'conflict') setTaken(true);
      else if (f.kind === 'offline') setOffline(true);
      else setError(f.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (taken) {
    return (
      <AuthScreen
        right={<StepRule label="Step 1" progress={0.5} />}
        onBack={() => setTaken(false)}
        footer={
          <>
            <PrimaryButton label="Sign in instead" onPress={() => router.replace({ pathname: '/login', params: { email: email.trim().toLowerCase() } })} />
            <OutlineButton label="Use a different email" onPress={() => { setTaken(false); setTimeout(() => emailRef.current?.focus(), 200); }} />
          </>
        }
      >
        <Headline>You already{'\n'}have one.</Headline>
        <Lede>That email is already on a Servika account. Sign in and everything you saved is still there.</Lede>
        <View style={{ marginTop: 18 }}>
          <UnderlineField label="Name" value={fullName} onChangeText={setFullName} editable={false} />
          <UnderlineField label="Email" value={email} onChangeText={setEmail} editable={false} tone="error" />
          <AppText weight="medium" style={styles.takenNote}>Already taken. That is your account.</AppText>
        </View>
      </AuthScreen>
    );
  }

  const showDomains = keyboardUp && focus === 'email';

  return (
    <AuthScreen
      right={<StepRule label="Step 1" progress={0.5} />}
      banner={offline ? <Banner text="No network. Nothing you typed is lost." actionLabel="Retry" onAction={submit} /> : null}
      footer={
        <>
          {showDomains ? (
            <View style={styles.domainRow}>
              {DOMAINS.map((d) => (
                <Pressable key={d} accessibilityRole="button" onPress={() => addDomain(d)} style={[styles.domainChip, d === '.ng' && { flex: 0, paddingHorizontal: 14 }]}>
                  <AppText weight="semibold" style={styles.domainLabel}>{d}</AppText>
                </Pressable>
              ))}
            </View>
          ) : (
            <AppText style={styles.consent}>
              Making an account means you accept our{' '}
              <AppText inline weight="semibold" style={styles.consentLink} onPress={() => Linking.openURL('https://servika.com.ng/terms').catch(() => {})}>Terms</AppText> and{' '}
              <AppText inline weight="semibold" style={styles.consentLink} onPress={() => Linking.openURL('https://servika.com.ng/privacy').catch(() => {})}>Privacy Policy</AppText>.
            </AppText>
          )}
          <PrimaryButton label="Send my code" loadingLabel="Sending your code" loading={submitting} disabled={weak} onPress={submit} />
          {keyboardUp ? null : (
            <>
              <GoogleAuthButton variant="dark" onBusyChange={setGoogleBusy} />
              <FooterLink prompt="Been here before?" action="Sign in instead" onPress={() => router.replace('/login')} />
            </>
          )}
        </>
      }
    >
      {weak ? (
        <>
          <Headline compact={keyboardUp}>That one is{keyboardUp ? ' ' : '\n'}too easy.</Headline>
          {keyboardUp ? null : <Lede>Your account can hold money in escrow. Eight characters and a number is the floor.</Lede>}
        </>
      ) : (
        <>
          <Headline compact={keyboardUp}>First, what do{keyboardUp ? ' ' : '\n'}we call you?</Headline>
          {keyboardUp ? null : <Lede>Name, email, a password you will remember. That is all we need to start.</Lede>}
        </>
      )}

      <View style={{ marginTop: keyboardUp ? 6 : 22 }}>
        <UnderlineField
          label="Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="What artisans should call you"
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          onFocus={() => setFocus('name')}
        />
        <UnderlineField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          inputRef={emailRef}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          onFocus={() => setFocus('email')}
        />
        <UnderlineField
          label="Password"
          value={password}
          onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
          placeholder="At least eight characters"
          secure={!show}
          autoComplete="new-password"
          inputRef={passwordRef}
          returnKeyType="done"
          onSubmitEditing={submit}
          onFocus={() => setFocus('password')}
          tone={weak ? 'error' : 'normal'}
          right={<TextAccessory label={show ? 'Hide' : 'Show'} tone={weak ? 'quiet' : 'orange'} onPress={() => setShow((v) => !v)} />}
        />
        <PasswordStrength password={password} checks={checks} showChecklist={weak} />
        {error ? <AppText style={inkStyles.error}>{error}</AppText> : null}
      </View>
      <GoogleInFlight visible={googleBusy} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  consent: { textAlign: 'center', fontSize: 11.5, lineHeight: 17, color: colors.onInkMeta, paddingHorizontal: 8 },
  consentLink: { fontSize: 11.5, color: colors.onInk },
  takenNote: { paddingTop: 14, fontSize: 13.5, color: colors.dangerOnInk },
  domainRow: { flexDirection: 'row', gap: 8 },
  domainChip: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.onInkFill },
  domainLabel: { fontSize: 13, color: 'rgba(243,235,223,0.75)' },
});
