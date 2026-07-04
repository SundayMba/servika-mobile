import { Ionicons } from '@expo/vector-icons';
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
import { colors } from '@/constants/colors';
import { authErrorMessage, register } from '@/lib/api/auth';

export default function Register() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // When set, the verification bottom sheet is shown for this email.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  // Focus chaining across fields.
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const referralRef = useRef<TextInput>(null);

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
        referralCode: referralCode.trim() || undefined,
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
          {/* Brand */}
          <View className="mb-7 items-center">
            <Image
              source={require('@assets/images/logo/app-icon.png')}
              style={{ height: 52, width: 52 }}
              contentFit="contain"
            />
            <Text className="mt-2 text-[18px] font-bold text-gray-900">
              Servika
            </Text>
          </View>

          {/* Heading */}
          <Text className="text-center text-[26px] font-bold text-gray-900">
            Create your account
          </Text>
          <Text className="mb-7 mt-2 text-center text-[14px] leading-5 text-gray-500">
            Book verified artisans and manage repairs safely.
          </Text>

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
              returnKeyType="next"
              onSubmitEditing={() => referralRef.current?.focus()}
            />
            <Input
              ref={referralRef}
              icon="gift-outline"
              placeholder="Referral code (optional)"
              value={referralCode}
              onChangeText={(t) => setReferralCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleCreateAccount}
            />
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
              label="Create Account"
              onPress={handleCreateAccount}
              loading={submitting}
            />
          </View>

          {/* Terms */}
          <View className="mt-4 flex-row items-start px-2">
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={colors.primary}
            />
            <Text className="text-center text-[12px] leading-4 text-gray-500">
              By continuing, you agree to our{' '}
              <Text className="font-semibold text-primary">Terms</Text> and{' '}
              <Text className="font-semibold text-primary">Privacy Policy</Text>
              .
            </Text>
          </View>

          {/* Social sign-up (visual placeholders) */}
          <View className="my-6">
            <SocialAuthButtons />
          </View>

          {/* Footer */}
          <View className="mt-6 flex-row items-center justify-center gap-1">
            <Text className="text-[14px] text-gray-500">
              Already have an account?
            </Text>
            <TouchableOpacity
              hitSlop={8}
              onPress={() => router.replace('/login')}
            >
              <Text className="text-[14px] font-bold text-primary">
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    </SafeAreaView>
  );
}
