import type Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GoogleInFlight, OutlineButton, PrimaryButton } from '@/components/auth/kit';
import { BottomSheet } from '@/components/BottomSheet';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

export type AuthPromptReason = 'book' | 'chat' | 'request' | 'tab' | 'save';

/** One kicker + headline + line per thing a guest can bump into. */
const COPY: Record<AuthPromptReason, { kicker: string; title: string; message: string }> = {
  book: { kicker: 'You tried to book', title: 'Booking is for people\nwe can vouch for.', message: 'Look at prices all day, nobody asks your name. To book an artisan, we need one.' },
  chat: { kicker: 'You tried to chat', title: 'Chat is for people\nwe can vouch for.', message: 'Look at prices all day, nobody asks your name. To message an artisan, we need one.' },
  request: { kicker: 'You tried to post a job', title: 'Artisans quote for\na real person.', message: 'Describe the job once you have a name and an email. Their offers land in your account.' },
  tab: { kicker: 'This part needs an account', title: 'Your bookings and chats\nlive behind a name.', message: 'Look at prices all day, nobody asks your name. To keep anything of your own, we need one.' },
  save: { kicker: 'You tried to save', title: 'Saving is for people\nwe can vouch for.', message: 'An account keeps your saved artisans on every phone you sign in on.' },
};

type AuthPromptSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** What the guest tried to do; picks the kicker, headline and line. */
  reason?: AuthPromptReason;
  /** Optional overrides when a screen needs its own words. */
  title?: string;
  message?: string;
  kicker?: string;
  /** Kept for call-site compatibility; the wall no longer draws an icon. */
  icon?: keyof typeof Ionicons.glyphMap;
  onSignUp?: () => void;
  onLogin?: () => void;
};

/**
 * The wall (design 10): a guest tried to do something that needs a name. An
 * ink sheet slides up over the screen they were on, woven strip on its lip,
 * cream type, one orange thing to press. Browsing never asks for an account;
 * "Not now, only looking" keeps the guest exactly where they were.
 */
export function AuthPromptSheet({
  visible,
  onClose,
  reason = 'book',
  title,
  message,
  kicker,
  onSignUp,
  onLogin,
}: AuthPromptSheetProps) {
  const copy = COPY[reason];
  const kickerText = kicker ?? copy.kicker;
  const titleText = title ?? copy.title;
  const messageText = message ?? copy.message;
  const router = useRouter();
  const [googleBusy, setGoogleBusy] = useState(false);
  const signUp = onSignUp ?? (() => { onClose(); router.push('/register'); });
  const logIn = onLogin ?? (() => { onClose(); router.push('/login'); });
  const hasGoogle = !!process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID;
  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle={false} surfaceStyle={styles.surface}>
      <View style={styles.body}>
        <AppText weight="semibold" style={styles.kicker}>{kickerText.toUpperCase()}</AppText>
        <AppText weight="medium" style={styles.title}>{titleText}</AppText>
        <AppText style={styles.message}>{messageText}</AppText>

        <View style={styles.actions}>
          <PrimaryButton label="Use my email" onPress={signUp} />
          {hasGoogle ? <GoogleAuthButton variant="dark" onBusyChange={setGoogleBusy} /> : <OutlineButton label="I already have an account" onPress={logIn} />}
        </View>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
            <AppText weight="medium" style={styles.notNow}>Not now, only looking</AppText>
          </Pressable>
          <View style={styles.divider} />
          <Pressable accessibilityRole="button" hitSlop={8} onPress={logIn}>
            <AppText weight="semibold" style={styles.signIn}>Sign in</AppText>
          </Pressable>
        </View>
      </View>
      <GoogleInFlight visible={googleBusy} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  surface: { backgroundColor: colors.inkWarmRaised, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  body: { paddingTop: 24, gap: 13 },
  kicker: { fontSize: 11.5, letterSpacing: 2, color: colors.orange },
  title: { fontSize: 26, lineHeight: 29, letterSpacing: -1, color: colors.onInk },
  message: { maxWidth: 300, fontSize: 14, lineHeight: 21, color: colors.onInkBody },
  actions: { marginTop: 13, gap: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 46 },
  divider: { width: 1, height: 14, backgroundColor: 'rgba(20,23,27,0.2)' },
  notNow: { fontSize: 14, color: colors.onInkMeta },
  signIn: { fontSize: 14, color: colors.onInk },
});
