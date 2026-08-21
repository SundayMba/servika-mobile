import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Linking,
  ScrollView,
  type TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VerifyEmailSheet } from '@/components/VerifyEmailSheet';
import { colors } from '@/constants/colors';
import { authErrorMessage, register } from '@/lib/api/auth';

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // When set, the verification bottom sheet is shown for this email.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  // Focus chaining across fields.
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleCreateAccount = async () => {
    if (submitting) return;
    setError(null);

    const name = fullName.trim();
    const emailValue = email.trim();
    const phoneNumber = phone.trim();
    if (!name || !emailValue || !phoneNumber || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const { email: registeredEmail } = await register({
        fullName: name,
        email: emailValue,
        phoneNumber,
        password,
      });
      // Registration doesn't log you in — slide up the verification sheet.
      setVerifyEmail(registeredEmail);
    } catch (e) {
      setError(authErrorMessage(e));
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
              source={require('@assets/images/logo/app-icon.webp')}
              style={{ height: 30, width: 30 }}
              contentFit="contain"
            />
          </View>
          <AppText weight="semibold" className="text-[17px] text-white">Servika</AppText>
        </View>

        <AppText weight="semibold" className="mt-6 text-[27px] text-white">
          Create your account
        </AppText>
        <AppText className="mt-1.5 text-[14px] leading-5 text-white/85">
          Book verified artisans and manage repairs safely.
        </AppText>
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
            <View className="gap-3.5">
              <Input
                icon="person-outline"
                placeholder="Full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <Input
                ref={emailRef}
                icon="mail-outline"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
              <Input
                ref={phoneRef}
                icon="call-outline"
                placeholder="Phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <Input
                ref={passwordRef}
                icon="lock-closed-outline"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                password
                autoCapitalize="none"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleCreateAccount}
              />
            </View>

            {/* Error */}
            {error ? (
              <AppText weight="medium" className="mt-4 text-center text-[13px] text-red-500">
                {error}
              </AppText>
            ) : null}

            {/* Submit */}
            <View className="mt-5">
              <Button
                label="Create Account"
                onPress={handleCreateAccount}
                loading={submitting}
              />
            </View>

            {/* Google sign-up (renders only when the OAuth client id is configured) */}
            <GoogleAuthButton />

            {/* Terms */}
            <View className="mt-5 flex-row items-start justify-center px-2">
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color={colors.primary}
              />
              <AppText className="ml-1 text-center text-[12px] leading-4 text-gray-500">
                By continuing, you agree to our{' '}
                <AppText
                  inline
                  weight="semibold"
                  className="text-primary"
                  onPress={() =>
                    Linking.openURL('https://servika.com.ng/terms').catch(() => {})
                  }
                >
                  Terms
                </AppText>{' '}
                and{' '}
                <AppText
                  inline
                  weight="semibold"
                  className="text-primary"
                  onPress={() =>
                    Linking.openURL('https://servika.com.ng/privacy').catch(
                      () => {},
                    )
                  }
                >
                  Privacy Policy
                </AppText>
                .
              </AppText>
            </View>

            {/* Footer */}
            <View className="mt-5 flex-row items-center justify-center gap-1">
              <AppText className="text-[14px] text-gray-500">
                Already have an account?
              </AppText>
              <TouchableOpacity
                hitSlop={8}
                onPress={() => router.replace('/login')}
              >
                <AppText weight="semibold" className="text-[14px] text-primary">
                  Sign In
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Email verification — slides up after a successful register. */}
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
