import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  type TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocialAuthButtons } from '@/components/ui/SocialAuthButtons';
import { VerifyEmailSheet } from '@/components/VerifyEmailSheet';
import { authErrorMessage, login } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Login() {
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="px-6"
        >
          {/* Hero */}
          <View className="mb-6 h-44 overflow-hidden rounded-3xl bg-background">
            <Image
              source={require('@assets/images/artisans/working/plumber_fixing_sink_pipes_with_wrench.png')}
              contentFit="cover"
              contentPosition="top"
              style={{ flex: 1 }}
            />
          </View>

          {/* Brand */}
          <View className="mb-5 flex-row items-center justify-center gap-2">
            <Image
              source={require('@assets/images/logo/app-icon.png')}
              style={{ height: 28, width: 28 }}
              contentFit="contain"
            />
            <Text className="text-[18px] font-bold text-gray-900">Servika</Text>
          </View>

          {/* Heading */}
          <Text className="text-center text-[26px] font-bold text-gray-900">
            Welcome back 👋
          </Text>
          <Text className="mb-7 mt-2 text-center text-[14px] leading-5 text-gray-500">
            Sign in to continue with Servika.
          </Text>

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

          {/* Social sign-in (visual placeholders) */}
          <View className="my-6">
            <SocialAuthButtons />
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-1">
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
    </SafeAreaView>
  );
}
