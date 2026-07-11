import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  type TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VerifyEmailSheet } from '@/components/VerifyEmailSheet';
import { authErrorMessage, login } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // When set, the account exists but its email isn't verified — show the sheet.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    if (submitting) return;
    setError(null);

    const emailOrPhone = identifier.trim();
    if (!emailOrPhone || !password) {
      setError('Enter your email/phone and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login({ emailOrPhone, password });
      if (res.session) {
        await signIn(res.session);
        router.replace('/home');
      } else if (res.verificationRequired) {
        // Account exists but email unverified — finish the verify step.
        setVerifyEmail(res.email);
      }
    } catch (e) {
      setError(authErrorMessage(e, 'Invalid email/phone or password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-primary">
      <StatusBar style="light" />

      {/* ── Brand-orange canopy: spans through the status bar, the white sheet
          below curves up over it (same language as Home) ── */}
      <View
        style={{ paddingTop: insets.top + 18 }}
        className="overflow-hidden bg-primary px-6 pb-14"
      >
        {/* Soft decorative circles */}
        <View
          pointerEvents="none"
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10"
        />
        <View
          pointerEvents="none"
          className="absolute -left-16 top-20 h-36 w-36 rounded-full bg-white/10"
        />

        <View className="flex-row items-center gap-2.5">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            <Image
              source={require('@assets/images/logo/app-icon.png')}
              style={{ height: 30, width: 30 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-[17px] font-bold text-white">Servika</Text>
        </View>

        <Text className="mt-6 text-[27px] font-bold text-white">
          Welcome back 👋
        </Text>
        <Text className="mt-1.5 text-[14px] leading-5 text-white/85">
          Sign in to continue with Servika.
        </Text>
      </View>

      {/* ── White sheet curving up into the orange ── */}
      <KeyboardAvoidingView
        className="-mt-7 flex-1"
        behavior="padding"
      >
        <View className="flex-1 overflow-hidden rounded-t-[32px] bg-white">
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 28,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            }}
          >
            {/* Form */}
            <View className="gap-4">
              <Input
                label="Email or phone"
                icon="mail-outline"
                placeholder="Enter your email or phone"
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <View>
                <Input
                  ref={passwordRef}
                  label="Password"
                  icon="lock-closed-outline"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  password
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
                <TouchableOpacity
                  hitSlop={8}
                  className="mt-2 self-end"
                  onPress={() => router.push('/forgot-password')}
                >
                  <Text className="text-[13px] font-semibold text-primary">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <Text className="mt-4 text-center text-[13px] font-medium text-red-500">
                {error}
              </Text>
            ) : null}

            {/* Submit */}
            <View className="mt-5">
              <Button
                label="Sign in"
                onPress={handleSignIn}
                loading={submitting}
              />
            </View>

            {/* Google sign-in (renders only when the OAuth client id is configured) */}
            <GoogleAuthButton />

            {/* Footer */}
            <View className="mt-7 flex-row items-center justify-center gap-1">
              <Text className="text-[14px] text-gray-500">
                Don&apos;t have an account?
              </Text>
              <TouchableOpacity
                hitSlop={8}
                onPress={() => router.replace('/register')}
              >
                <Text className="text-[14px] font-bold text-primary">
                  Create account
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Unverified account → finish email verification, then home. */}
      <VerifyEmailSheet
        visible={verifyEmail !== null}
        email={verifyEmail ?? ''}
        onClose={() => setVerifyEmail(null)}
        onVerified={() => {
          setVerifyEmail(null);
          router.replace('/home');
        }}
      />
    </View>
  );
}
