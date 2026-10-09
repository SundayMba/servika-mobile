import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { GoogleG } from '@/components/auth/GoogleG';
import { AppText } from '@/components/ui/AppText';
import { appAlert } from '@/components/ui/AppAlert';
import { authErrorMessage, googleLogin } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

// The WEB OAuth client id (not the Android one) — it's the audience of the ID
// token the backend verifies. Unset ⇒ the button doesn't render at all, so we
// never ship a dead button.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID;


/**
 * "or continue with" divider + the round Google icon button (icon-only, per
 * design). Runs the native Google sign-in flow, exchanges the ID token for a
 * Servika session at POST /auth/google, and lands the user on Home — no OTP
 * step, Google already verified the email.
 */
/**
 * @param onSignedIn Runs after the Servika session is stored. Default: go Home.
 *   The sign-in wall passes its own handler so the guest stays on the screen
 *   they were on and the thing they tried to do simply happens.
 */
export function GoogleAuthButton({ variant = 'light', onBusyChange, onSignedIn }: { variant?: 'light' | 'dark'; onBusyChange?: (busy: boolean) => void; onSignedIn?: () => void } = {}) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [busy, setBusyState] = useState(false);
  const setBusy = (b: boolean) => {
    setBusyState(b);
    onBusyChange?.(b);
  };

  if (!WEB_CLIENT_ID) return null;

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Lazy require: builds made before this native module was added must not
      // crash at startup — only this button needs it.
      /* eslint-disable @typescript-eslint/no-require-imports */
      const {
        GoogleSignin,
      } = require('@react-native-google-signin/google-signin');
      /* eslint-enable @typescript-eslint/no-require-imports */
      GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // The SDK remembers the last-used account and silently reuses it on the
      // next signIn(). Clear that device-side cache first so the account picker
      // shows every time — the user chooses which Google account to use.
      // (Best-effort: fails only when nothing was cached.)
      await GoogleSignin.signOut().catch(() => {});
      const result = await GoogleSignin.signIn();
      // v13+ returns { type: 'success', data: { idToken } }; cancel → no token.
      const idToken: string | undefined =
        result?.data?.idToken ?? result?.idToken;
      if (!idToken) return; // user dismissed the account picker

      const session = await googleLogin(idToken);
      await signIn(session);
      if (onSignedIn) onSignedIn();
      else router.replace('/home');
    } catch (e: unknown) {
      const code = (e as { code?: string | number })?.code;
      // Cancelled / in-progress are not errors worth alerting about.
      if (
        code === 'SIGN_IN_CANCELLED' ||
        code === 'IN_PROGRESS' ||
        code === 12501
      )
        return;
      appAlert(
        'Google sign-in failed',
        authErrorMessage(
          e,
          'Could not sign in with Google. If Google sign-in was just added, rebuild the app and try again.',
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'dark') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        disabled={busy}
        onPress={handlePress}
        style={[darkStyles.outline, busy ? { opacity: 0.6 } : null]}
      >
        {busy ? <ActivityIndicator size="small" color="#14171B" /> : <GoogleG size={18} />}
        <AppText weight="semibold" style={darkStyles.label}>Continue with Google</AppText>
      </Pressable>
    );
  }

  return (
    <View className="mt-6">
      {/* Divider */}
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-gray-200" />
        <AppText className="text-[12px] text-gray-400">or continue with</AppText>
        <View className="h-px flex-1 bg-gray-200" />
      </View>

      {/* Full-width Google button (Google's recommended light style) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        onPress={handlePress}
        className="mt-4 h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white active:bg-gray-50"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        {busy ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <GoogleG size={20} />
        )}
        <AppText weight="semibold" className="text-[15px] text-gray-800">Google</AppText>
      </Pressable>
    </View>
  );
}

const darkStyles = StyleSheet.create({
  outline: {
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(20,23,27,0.24)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: { fontSize: 15.5, letterSpacing: -0.2, color: '#14171B' },
});
