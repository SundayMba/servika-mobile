import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthScreen, Banner, CheckTile, classifyAuthError, CodeDigits, FooterLink, Headline, inkStyles, Lede, OutlineButton, PrimaryButton, ResendRow, Rule, StepRule } from '@/components/auth/kit';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { resendOtp, verifyOtp } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

const LENGTH = 6;
const RESEND_COOLDOWN = 60; // the backend's resend throttle
const CODE_LIFE_MS = 10 * 60_000; // the backend's code lifetime
const MAX_TRIES = 3; // we stop before the server's own limit so the copy stays true

type Phase = 'clean' | 'checking' | 'wrong' | 'expired' | 'locked' | 'offline' | 'done';

/**
 * Six digits, nothing else (design 12 and its edges, then 14). The code is
 * emailed at registration or on an unverified sign-in, so the screen opens in
 * cooldown. Digits land straight on the page; the sixth one verifies at once.
 * Wrong three times reaches the locked state, which offers a fresh code or a
 * password reset instead of a dead end.
 */
export default function Verify() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { email = '', flow = 'register', name = '' } = useLocalSearchParams<{ email?: string; flow?: string; name?: string }>();
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('clean');
  const [tries, setTries] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [firstName, setFirstName] = useState(name.split(/\s+/)[0] ?? '');
  const sentAt = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
      if (Date.now() - sentAt.current > CODE_LIFE_MS) setPhase((p) => (p === 'clean' || p === 'wrong' ? 'expired' : p));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const submit = async (value: string) => {
    if (phase === 'checking' || value.length < LENGTH) return;
    setPhase('checking');
    setMessage(null);
    try {
      const res = await verifyOtp({ otpCode: value, otpType: 'account_verification', emailOrPhone: email });
      if (res.verified && res.accessToken && res.accessTokenExpiresAtUtc && res.refreshToken && res.user) {
        await signIn({ accessToken: res.accessToken, accessTokenExpiresAtUtc: res.accessTokenExpiresAtUtc, refreshToken: res.refreshToken, user: res.user, verificationRequired: false });
        setFirstName(res.user.fullName.split(/\s+/)[0] ?? '');
        setPhase('done');
      } else {
        fail();
      }
    } catch (e) {
      const f = classifyAuthError(e);
      if (f.kind === 'offline') setPhase('offline');
      else if (f.kind === 'rate') { setMessage(f.message); setPhase('locked'); }
      else fail();
    }
  };

  const fail = () => {
    const n = tries + 1;
    setTries(n);
    if (Date.now() - sentAt.current > CODE_LIFE_MS) return setPhase('expired');
    setPhase(n >= MAX_TRIES ? 'locked' : 'wrong');
  };

  const onChange = (v: string) => {
    if (phase === 'wrong' || phase === 'offline') setPhase('clean');
    setCode(v);
    if (v.length === LENGTH) void submit(v);
  };

  const resend = async () => {
    setMessage(null);
    try {
      await resendOtp({ emailOrPhone: email, otpType: 'account_verification' });
      sentAt.current = Date.now();
      setTries(0);
      setCode('');
      setCooldown(RESEND_COOLDOWN);
      setPhase('clean');
      setMessage('A fresh code is on its way.');
    } catch (e) {
      const f = classifyAuthError(e);
      if (f.kind === 'offline') setPhase('offline');
      else setMessage(f.message);
    }
  };

  const home = () => {
    router.dismissAll();
    router.replace('/home');
  };

  if (phase === 'done') {
    return (
      <AuthScreen back={false} contentStyle={styles.doneContent} footer={<PrimaryButton label="Take me home" onPress={home} />}>
        <CheckTile />
        <View style={{ marginTop: 30 }}>
          <Headline>You are in{firstName ? `,\n${firstName}.` : '.'}</Headline>
          <Lede>Email verified. Home is waiting, and anything you were about to do is one tap away.</Lede>
        </View>
      </AuthScreen>
    );
  }

  const left = MAX_TRIES - tries;
  const digitsTone = phase === 'wrong' ? 'wrong' : phase === 'locked' || phase === 'expired' || phase === 'offline' ? 'dim' : 'normal';

  return (
    <AuthScreen
      right={flow === 'register' ? <StepRule label="Step 2" progress={1} /> : undefined}
      kicker={flow === 'register' ? undefined : 'Confirming your email'}
      banner={phase === 'offline' ? <Banner text="No network. Your code never left." actionLabel="Retry" onAction={() => setPhase('clean')} /> : null}
      footer={
        <>
          {phase === 'locked' ? (
            <>
              <PrimaryButton label="Send a fresh code" icon="refresh" onPress={resend} />
              <OutlineButton label="Reset my password instead" onPress={() => router.push({ pathname: '/forgot-password', params: { email } })} />
            </>
          ) : phase === 'expired' ? (
            <PrimaryButton label="Send a fresh code" icon="refresh" onPress={resend} />
          ) : phase === 'offline' ? (
            <OutlineButton label="Try again" trailing="refresh" onPress={() => { setPhase('clean'); if (code.length === LENGTH) void submit(code); }} />
          ) : phase === 'wrong' ? (
            <PrimaryButton label="Try this code" disabled={code.length < LENGTH} onPress={() => submit(code)} />
          ) : (
            <PrimaryButton label="Let me in" loadingLabel="Checking your code" loading={phase === 'checking'} disabled={code.length < LENGTH} onPress={() => submit(code)} />
          )}
          <FooterLink action="Wrong email? Change it" onPress={() => (router.canGoBack() ? router.back() : router.replace('/register'))} />
        </>
      }
    >
      {phase === 'locked' ? (
        <>
          <Headline>Let us start{'\n'}that again.</Headline>
          <Lede>The code you were given is dead now.</Lede>
        </>
      ) : (
        <>
          <Headline>Six digits,{'\n'}nothing else.</Headline>
          <Lede>Sent to {email}. It lands in seconds.</Lede>
        </>
      )}

      <View style={{ marginTop: 36, gap: 24 }}>
        <CodeDigits value={phase === 'locked' || phase === 'expired' ? '' : code} onChange={onChange} tone={digitsTone} editable={phase === 'clean' || phase === 'wrong' || phase === 'offline'} />
        <Rule tone={phase === 'wrong' || phase === 'locked' ? 'wrong' : 'normal'} />
        {phase === 'wrong' ? (
          <AppText weight="medium" style={styles.wrong}>That is not the code. {left === 1 ? 'One try left' : `${['', '', 'Two'][left] ?? left} tries left`}, then we start over.</AppText>
        ) : phase === 'locked' ? (
          <View style={{ gap: 9 }}>
            <AppText weight="semibold" style={styles.lockedTitle}>That was three tries.</AppText>
            <AppText style={styles.lockedBody}>{message ?? 'We stopped that code so nobody can guess their way in. Ask for a fresh one, or reset your password and skip the guessing.'}</AppText>
          </View>
        ) : phase === 'expired' ? (
          <AppText weight="medium" style={styles.expired}>That code timed out. Ten minutes is all it gets.</AppText>
        ) : phase === 'offline' ? (
          <AppText style={styles.lockedBody}>Nothing you typed is lost. Your details sit on this phone until the code gets through.</AppText>
        ) : (
          <ResendRow cooldown={cooldown} onResend={resend} onPaste={(c) => onChange(c)} />
        )}
        {message && phase !== 'locked' ? <AppText style={inkStyles.notice}>{message}</AppText> : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  doneContent: { flexGrow: 1, justifyContent: 'center' },
  wrong: { fontSize: 13.5, color: colors.dangerOnInk },
  lockedTitle: { fontSize: 15, color: colors.dangerOnInk },
  lockedBody: { fontSize: 13.5, lineHeight: 22, color: colors.onInkBody },
  expired: { fontSize: 13.5, color: colors.amberOnInk },
});
