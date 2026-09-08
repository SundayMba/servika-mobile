import type Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GoogleInFlight, OutlineButton, PrimaryButton, WovenStrip } from '@/components/auth/kit';
import { BottomSheet } from '@/components/BottomSheet';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';

type AuthPromptSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Headline shown in the sheet. */
  title?: string;
  /** Supporting copy beneath the headline. */
  message?: string;
  /** Small kicker above the headline ("YOU TRIED TO CHAT"). */
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
  title = 'This part is for people\nwe can vouch for.',
  message = 'Look at prices all day, nobody asks your name. To book or message an artisan, we need one.',
  kicker = 'Sign in to continue',
  onSignUp,
  onLogin,
}: AuthPromptSheetProps) {
  const router = useRouter();
  const [googleBusy, setGoogleBusy] = useState(false);
  const signUp = onSignUp ?? (() => { onClose(); router.push('/register'); });
  const logIn = onLogin ?? (() => { onClose(); router.push('/login'); });
  const hasGoogle = !!process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID;
  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle={false} surfaceStyle={styles.surface}>
      <WovenStrip style={styles.strip} />
      <View style={styles.body}>
        <AppText weight="semibold" style={styles.kicker}>{kicker.toUpperCase()}</AppText>
        <AppText weight="medium" style={styles.title}>{title}</AppText>
        <AppText style={styles.message}>{message}</AppText>

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
  surface: { backgroundColor: colors.inkWarm, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 0 },
  strip: { marginHorizontal: -24 },
  body: { paddingTop: 24, gap: 13 },
  kicker: { fontSize: 11.5, letterSpacing: 2, color: colors.orange },
  title: { fontSize: 33, lineHeight: 35, letterSpacing: -1.5, color: colors.onInk },
  message: { maxWidth: 300, fontSize: 14.5, lineHeight: 23, color: colors.onInkBody },
  actions: { marginTop: 13, gap: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 46 },
  divider: { width: 1, height: 14, backgroundColor: 'rgba(243,235,223,0.2)' },
  notNow: { fontSize: 14, color: colors.onInkMeta },
  signIn: { fontSize: 14, color: colors.onInk },
});
