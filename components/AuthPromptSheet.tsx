import type Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { OutlineButton, PrimaryButton, WovenStrip } from '@/components/auth/kit';
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
 * The wall (design 10): a guest tried to do something that needs a name. Warm
 * ink sheet with the woven strip on its lip, cream type, and one orange thing
 * to press. Browsing never asks for an account; this only appears at the
 * moment an action needs one, and "Not now" keeps the guest browsing.
 */
export function AuthPromptSheet({
  visible,
  onClose,
  title = 'This part is for people we can vouch for.',
  message = 'Look at prices all day, nobody asks your name. To book or message an artisan, we need one.',
  kicker = 'Sign in to continue',
  onSignUp,
  onLogin,
}: AuthPromptSheetProps) {
  const router = useRouter();
  const signUp =
    onSignUp ??
    (() => {
      onClose();
      router.push('/register');
    });
  const logIn =
    onLogin ??
    (() => {
      onClose();
      router.push('/login');
    });
  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle={false} surfaceStyle={styles.surface}>
      <WovenStrip opacity={0.7} style={styles.strip} />
      <View style={styles.body}>
        <AppText weight="semibold" style={styles.kicker}>
          {kicker.toUpperCase()}
        </AppText>
        <AppText weight="medium" style={styles.title}>
          {title}
        </AppText>
        <AppText style={styles.message}>{message}</AppText>

        <View style={styles.actions}>
          <PrimaryButton label="Use my email" onPress={signUp} />
          <GoogleAuthButton variant="dark" />
          {!process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID ? <OutlineButton label="I already have an account" onPress={logIn} /> : null}
        </View>

        <View style={styles.footer}>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
            <AppText style={styles.notNow}>Not now, only looking</AppText>
          </Pressable>
          <View style={styles.divider} />
          <Pressable accessibilityRole="button" hitSlop={8} onPress={logIn}>
            <AppText weight="semibold" style={styles.signIn}>
              Sign in
            </AppText>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  surface: { backgroundColor: colors.inkWarm, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 0 },
  strip: { marginHorizontal: -24 },
  body: { paddingTop: 18 },
  kicker: { fontSize: 11, letterSpacing: 1.8, color: colors.orangeOnDark },
  title: { marginTop: 10, fontSize: 28, lineHeight: 32, letterSpacing: -1, color: colors.onInk },
  message: { marginTop: 10, fontSize: 14.5, lineHeight: 21, color: colors.onInkBody },
  actions: { marginTop: 22, gap: 12 },
  footer: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  divider: { width: 1, height: 14, backgroundColor: colors.onInkRule },
  notNow: { fontSize: 13.5, color: colors.onInkMeta },
  signIn: { fontSize: 13.5, color: colors.onInk },
});
