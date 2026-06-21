import { Ionicons } from '@expo/vector-icons';
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
import { colors } from '@/constants/colors';
import { authErrorMessage, forgotPassword, resetPassword } from '@/lib/api/auth';

type Step = 'request' | 'reset';

export default function ForgotPassword() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // Step 1 — start the reset. The server never reveals whether the account
  // exists, so we always advance to the code-entry step on success.
  const handleSendCode = async () => {
    if (submitting) return;
    setError(null);
    const emailOrPhone = identifier.trim();
    if (!emailOrPhone) {
      setError('Enter your email or phone.');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(emailOrPhone);
      setNotice('We sent a reset code. Enter it below with your new password.');
      setStep('reset');
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 — complete the reset, then route to login.
  const handleReset = async () => {
    if (submitting) return;
    setError(null);
    if (code.trim().length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword({
        emailOrPhone: identifier.trim(),
        tokenOrOtp: code.trim(),
        newPassword: password,
        confirmPassword: confirm,
      });
      router.replace('/login');
    } catch (e) {
      setError(authErrorMessage(e, 'That reset code is invalid or has expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);
    try {
      await forgotPassword(identifier.trim());
      setNotice('A new reset code is on its way.');
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Back */}
      <View className="h-12 justify-center px-5">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-50"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

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
          {/* Heading */}
          <Text className="text-center text-[26px] font-bold text-gray-900">
            {step === 'request' ? 'Forgot password?' : 'Reset password'}
          </Text>
          <Text className="mb-7 mt-2 text-center text-[14px] leading-5 text-gray-500">
            {step === 'request'
              ? 'Enter your email or phone and we’ll send you a reset code.'
              : 'Enter the code we sent and choose a new password.'}
          </Text>

          {notice ? (
            <View className="mb-4 flex-row items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.primary}
              />
              <Text className="flex-1 text-[13px] leading-5 text-gray-600">
                {notice}
              </Text>
            </View>
          ) : null}

          {step === 'request' ? (
            <View className="gap-4">
              <Input
                label="Email or phone"
                icon="mail-outline"
                placeholder="Enter your email or phone"
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="send"
                onSubmitEditing={handleSendCode}
              />
            </View>
          ) : (
            <View className="gap-4">
              <Input
                label="Reset code"
                icon="keypad-outline"
                placeholder="6-digit code"
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <Input
                ref={passwordRef}
                label="New password"
                icon="lock-closed-outline"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                password
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <Input
                ref={confirmRef}
                label="Confirm password"
                icon="lock-closed-outline"
                placeholder="Re-enter your new password"
                value={confirm}
                onChangeText={setConfirm}
                password
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
            </View>
          )}

          {error ? (
            <Text className="mt-4 text-center text-[13px] font-medium text-red-500">
              {error}
            </Text>
          ) : null}

          <View className="mt-5">
            {step === 'request' ? (
              <Button
                label="Send reset code"
                onPress={handleSendCode}
                loading={submitting}
              />
            ) : (
              <Button
                label="Reset password"
                onPress={handleReset}
                loading={submitting}
              />
            )}
          </View>

          {step === 'reset' ? (
            <View className="mt-5 flex-row items-center justify-center gap-1">
              <Text className="text-[14px] text-gray-500">
                Didn’t get a code?
              </Text>
              <TouchableOpacity hitSlop={8} onPress={handleResend}>
                <Text className="text-[14px] font-bold text-primary">Resend</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-5 flex-row items-center justify-center gap-1">
              <Text className="text-[14px] text-gray-500">
                Remembered it?
              </Text>
              <TouchableOpacity hitSlop={8} onPress={() => router.replace('/login')}>
                <Text className="text-[14px] font-bold text-primary">Sign in</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
