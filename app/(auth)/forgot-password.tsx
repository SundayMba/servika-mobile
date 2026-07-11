import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  type TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/colors';
import { authErrorMessage, forgotPassword, resetPassword } from '@/lib/api/auth';

type Step = 'request' | 'reset';

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  // 60s resend cooldown (matches the backend throttle) so rapid taps can't 429.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

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
      setResendIn(60);
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
    if (resendIn > 0) return;
    setError(null);
    setNotice(null);
    setResendIn(60);
    try {
      await forgotPassword(identifier.trim());
      setNotice('A new reset code is on its way.');
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  return (
    <View className="flex-1 bg-primary">
      <StatusBar style="light" />

      {/* ── Brand-orange canopy (same language as login/register) ── */}
      <View
        style={{ paddingTop: insets.top + 12 }}
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

        {/* Back */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text className="mt-5 text-[27px] font-bold text-white">
          {step === 'request' ? 'Forgot password?' : 'Reset password'}
        </Text>
        <Text className="mt-1.5 text-[14px] leading-5 text-white/85">
          {step === 'request'
            ? 'Enter your email or phone and we’ll send you a reset code.'
            : 'Enter the code we sent and choose a new password.'}
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
              <TouchableOpacity hitSlop={8} onPress={handleResend} disabled={resendIn > 0}>
                <Text className={`text-[14px] font-bold ${resendIn > 0 ? 'text-gray-400' : 'text-primary'}`}>
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend'}
                </Text>
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
