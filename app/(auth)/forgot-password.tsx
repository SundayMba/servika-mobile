import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, Banner, CheckTile, classifyAuthError, CodeDigits, FooterLink, Headline, inkStyles, Lede, passwordChecks, passwordPasses, PasswordStrength, PrimaryButton, ResendRow, Rule, TextAccessory, UnderlineField } from '@/components/auth/kit';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { forgotPassword, login, resetPassword } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

type Step = 'email' | 'code' | 'password' | 'changed';
const RESEND_COOLDOWN = 60;

/**
 * Lost password, the whole way back (designs 15 to 18). Which email, six
 * digits, a new password, then we sign you in with it right here. The server
 * never says whether an address has an account, so the first step says so
 * plainly instead of pretending a mail is coming.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const { signIn } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [codeWrong, setCodeWrong] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const checks = useMemo(() => passwordChecks(password, '', email), [password, email]);
  const passes = passwordPasses(checks);
  const matches = confirm.length > 0 && confirm === password;

  const request = async () => {
    if (submitting) return;
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/^\+?\d{10,14}$/.test(value)) return setError('That does not look like an email. The code goes there.');
    setError(null);
    setOffline(false);
    setSubmitting(true);
    try {
      await forgotPassword(value);
      setEmail(value);
      setStep('code');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      const f = classifyAuthError(e);
      if (f.kind === 'offline') setOffline(true);
      else setError(f.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setNotice(null);
    try {
      await forgotPassword(email);
      setCooldown(RESEND_COOLDOWN);
      setCode('');
      setCodeWrong(false);
      setNotice('A fresh code is on its way.');
    } catch (e) {
      setError(classifyAuthError(e).message);
    }
  };

  const save = async () => {
    if (submitting) return;
    if (!passes) return setError('Eight characters and a number is the floor.');
    if (!matches) return setError('The two passwords do not match yet.');
    setError(null);
    setOffline(false);
    setSubmitting(true);
    try {
      await resetPassword({ emailOrPhone: email, tokenOrOtp: code, newPassword: password, confirmPassword: confirm });
      // The reset itself grants no session, so sign in with the new password here.
      const res = await login({ emailOrPhone: email, password });
      if (res.session) await signIn(res.session);
      setStep('changed');
    } catch (e) {
      const f = classifyAuthError(e);
      if (f.kind === 'offline') setOffline(true);
      else if (f.kind === 'invalid') {
        setCodeWrong(true);
        setStep('code');
        setError('That code is wrong or has timed out. Try it again or ask for a fresh one.');
      } else setError(f.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'changed') {
    return (
      <AuthScreen back={false} contentStyle={styles.doneContent} footer={<PrimaryButton label="Take me home" onPress={() => { router.dismissAll(); router.replace('/home'); }} />}>
        <CheckTile />
        <View style={{ marginTop: 30 }}>
          <Headline>New password,{'\n'}same you.</Headline>
          <Lede>You are signed in on this phone. Any other phone you used stays signed in until it next checks with us, so sign out there if that was not you.</Lede>
        </View>
      </AuthScreen>
    );
  }

  if (step === 'code') {
    return (
      <AuthScreen
        kicker="Reset · step 2"
        onBack={() => setStep('email')}
        footer={
          <>
            <PrimaryButton label="Continue" disabled={code.length < 6} onPress={() => { setError(null); setStep('password'); }} />
            <FooterLink action="Wrong email? Change it" onPress={() => setStep('email')} />
          </>
        }
      >
        <Headline>Six digits to{'\n'}prove it is you.</Headline>
        <Lede>Sent to {email}</Lede>
        <View style={{ marginTop: 36, gap: 24 }}>
          <CodeDigits value={code} onChange={(v) => { setCode(v); setCodeWrong(false); setError(null); }} tone={codeWrong ? 'wrong' : 'normal'} />
          <Rule tone={codeWrong ? 'wrong' : 'normal'} />
          <ResendRow cooldown={cooldown} onResend={resend} onPaste={setCode} />
          {notice ? <AppText style={inkStyles.notice}>{notice}</AppText> : null}
          {error ? <AppText style={[inkStyles.error, { marginTop: 0 }]}>{error}</AppText> : null}
        </View>
      </AuthScreen>
    );
  }

  if (step === 'password') {
    return (
      <AuthScreen
        kicker="Reset · step 3"
        onBack={() => setStep('code')}
        banner={offline ? <Banner text="No network. Nothing you typed is lost." actionLabel="Retry" onAction={save} /> : null}
        footer={<PrimaryButton label="Save and sign in" loadingLabel="Saving" loading={submitting} disabled={!passes || !matches} onPress={save} />}
      >
        <Headline>Pick something{'\n'}you will keep.</Headline>
        <Lede>Eight characters and a number. You are signed in here the moment it saves.</Lede>
        <View style={{ marginTop: 18 }}>
          <UnderlineField
            label="New password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least eight characters"
            secure={!show}
            autoComplete="new-password"
            autoFocus
            right={<TextAccessory label={show ? 'Hide' : 'Show'} onPress={() => setShow((v) => !v)} />}
          />
          <PasswordStrength password={password} checks={checks} showChecklist={password.length > 0 && !passes} />
          <View style={{ marginTop: 10 }}>
            <UnderlineField
              label="Type it again"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Same again"
              secure={!show}
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={save}
              right={
                matches ? (
                  <View style={styles.tick}>
                    <Ionicons name="checkmark" size={13} color={colors.orangeOnDark} />
                  </View>
                ) : null
              }
            />
          </View>
          {error ? <AppText style={inkStyles.error}>{error}</AppText> : null}
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      kicker="Reset · step 1"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
      banner={offline ? <Banner text="No network. Nothing you typed is lost." actionLabel="Retry" onAction={request} /> : null}
      footer={
        <>
          <PrimaryButton label="Send the code" loadingLabel="Sending the code" loading={submitting} onPress={request} />
          <FooterLink action="I remember it after all" onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} />
        </>
      }
    >
      <Headline>Which email{'\n'}do you use?</Headline>
      <Lede>We send six digits to it. Nothing about your account changes until you use them.</Lede>
      <View style={{ marginTop: 18 }}>
        <UnderlineField
          label="Email"
          value={email}
          onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="username"
          returnKeyType="done"
          onSubmitEditing={request}
          autoFocus={!email}
          tone={error ? 'error' : 'normal'}
        />
        <AppText style={styles.hint}>The code only goes out if an account uses this address. Check spam if it takes more than a minute.</AppText>
        {error ? <AppText style={inkStyles.error}>{error}</AppText> : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  doneContent: { flexGrow: 1, justifyContent: 'center' },
  hint: { paddingTop: 14, fontSize: 12.5, lineHeight: 19, color: colors.onInkFaint },
  tick: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(228,98,10,0.16)' },
});
