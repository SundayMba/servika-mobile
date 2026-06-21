import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/ui/Button';
import { authErrorMessage, resendOtp, verifyOtp } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds — matches the backend resend throttle

type VerifyEmailSheetProps = {
  visible: boolean;
  /** The email the code was sent to. */
  email: string;
  /** Dismiss without verifying (back-out). */
  onClose: () => void;
  /** Fired after a successful verify + sign-in. */
  onVerified: () => void;
};

/**
 * OPay/PalmPay-style verification sheet: slides up from the register screen with
 * segmented code boxes that auto-verify on the 6th digit. Owns the verify-otp +
 * sign-in; the parent just navigates onVerified.
 */
export function VerifyEmailSheet({
  visible,
  email,
  onClose,
  onVerified,
}: VerifyEmailSheetProps) {
  const { signIn } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // A code is emailed at registration, so the sheet opens already in cooldown.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  // Reset state each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setCode('');
      setError(null);
      setNotice(null);
      setCooldown(RESEND_COOLDOWN);
    }
  }, [visible]);

  // Resend countdown.
  useEffect(() => {
    if (!visible || cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [visible, cooldown]);

  const submit = async (value: string) => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await verifyOtp({
        otpCode: value,
        otpType: 'account_verification',
        emailOrPhone: email,
      });
      if (
        res.verified &&
        res.accessToken &&
        res.accessTokenExpiresAtUtc &&
        res.refreshToken &&
        res.user
      ) {
        await signIn({
          accessToken: res.accessToken,
          accessTokenExpiresAtUtc: res.accessTokenExpiresAtUtc,
          refreshToken: res.refreshToken,
          user: res.user,
          verificationRequired: false,
        });
        onVerified();
      } else {
        setError('That code is invalid or has expired.');
        setCode('');
      }
    } catch (e) {
      setError(authErrorMessage(e, 'That code is invalid or has expired.'));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError(null);
    // Auto-verify the moment all six digits are entered.
    if (digits.length === CODE_LENGTH) submit(digits);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setNotice(null);
    try {
      await resendOtp({ emailOrPhone: email, otpType: 'account_verification' });
      setNotice('A new code is on its way.');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onOpened={() => inputRef.current?.focus()}
    >
      <Text className="text-center text-[20px] font-bold text-gray-900">
        Verify your email
      </Text>
      <Text className="mb-6 mt-2 text-center text-[14px] leading-5 text-gray-500">
        Enter the 6-digit code we sent to{'\n'}
        <Text className="font-semibold text-gray-700">{email}</Text>
      </Text>

      {/* Segmented code boxes (a hidden input captures the keystrokes). */}
      <Pressable
        accessibilityRole="none"
        onPress={() => inputRef.current?.focus()}
        className="flex-row justify-between"
      >
        {Array.from({ length: CODE_LENGTH }).map((_, i) => {
          const filled = i < code.length;
          const active = i === code.length;
          return (
            <View
              key={i}
              className={[
                'h-14 w-12 items-center justify-center rounded-2xl border',
                active
                  ? 'border-primary bg-orange-50'
                  : filled
                    ? 'border-gray-300 bg-white'
                    : 'border-gray-200 bg-gray-50',
              ].join(' ')}
            >
              <Text className="text-[22px] font-bold text-gray-900">
                {code[i] ?? ''}
              </Text>
            </View>
          );
        })}

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          caretHidden
          editable={!submitting}
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        />
      </Pressable>

      {notice ? (
        <Text className="mt-4 text-center text-[13px] font-medium text-primary">
          {notice}
        </Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-center text-[13px] font-medium text-red-500">
          {error}
        </Text>
      ) : null}

      <View className="mt-6">
        <Button
          label="Verify & continue"
          loading={submitting}
          onPress={() => {
            if (code.length === CODE_LENGTH) submit(code);
            else setError('Enter the 6-digit code from your email.');
          }}
        />
      </View>

      {/* Resend */}
      <View className="mt-4 flex-row items-center justify-center gap-1">
        <Text className="text-[14px] text-gray-500">Didn’t get the code?</Text>
        <Pressable hitSlop={8} disabled={cooldown > 0} onPress={handleResend}>
          <Text
            className={
              cooldown > 0
                ? 'text-[14px] font-bold text-gray-300'
                : 'text-[14px] font-bold text-primary'
            }
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
