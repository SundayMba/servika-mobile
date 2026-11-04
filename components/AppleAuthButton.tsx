import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { appAlert } from '@/components/ui/AppAlert';
import { appleLogin, authErrorMessage } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

// Lazy require: Android and builds made before this native module was added must not crash, and the
// button only exists on iPhones.
type AppleModule = typeof import('expo-apple-authentication');
let apple: AppleModule | null = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    apple = require('expo-apple-authentication') as AppleModule;
  } catch {
    apple = null;
  }
}

/**
 * "Sign in with Apple", iPhone only, in Apple's own button style (App Store review requires it whenever
 * another social sign-in is offered). Exchanges Apple's identity token for a Servika session at
 * POST /auth/apple. Apple shares the name only the first time, so it is sent along when present.
 */
export function AppleAuthButton({
  variant = 'light',
  onBusyChange,
  onSignedIn,
}: { variant?: 'light' | 'dark'; onBusyChange?: (busy: boolean) => void; onSignedIn?: () => void } = {}) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apple?.isAvailableAsync().then(setAvailable).catch(() => setAvailable(false));
  }, []);

  if (!apple || !available) return null;
  const A = apple;

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    onBusyChange?.(true);
    try {
      const credential = await A.signInAsync({
        requestedScopes: [A.AppleAuthenticationScope.FULL_NAME, A.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) return;
      const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ').trim();
      const session = await appleLogin(credential.identityToken, name || null);
      await signIn(session);
      if (onSignedIn) onSignedIn();
      else router.replace('/home');
    } catch (e: unknown) {
      // The user closed Apple's sheet: not an error.
      if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return;
      appAlert('Apple sign-in failed', authErrorMessage(e, 'Could not sign in with Apple. Please try again.'));
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  return (
    <View style={{ opacity: busy ? 0.6 : 1 }} pointerEvents={busy ? 'none' : 'auto'}>
      <A.AppleAuthenticationButton
        buttonType={A.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={variant === 'dark' ? A.AppleAuthenticationButtonStyle.WHITE_OUTLINE : A.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={16}
        style={{ width: '100%', height: variant === 'dark' ? 52 : 56 }}
        onPress={handlePress}
      />
    </View>
  );
}
