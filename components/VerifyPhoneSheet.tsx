import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/ui/Button';
import { authErrorMessage, sendPhoneOtp, verifyPhoneOtp } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds — matches the backend resend throttle

type VerifyPhoneSheetProps = {
  visible: boolean;
  /** The phone number the code is sent to (the account's number). */
  phoneNumber: string;
  onClose: () => void;
  /** Fired after a successful verify (the cached user is already updated). */
  onVerified: () => void;
};

/**
 * Phone-verification sheet — same segmented-code UX as the email sheet, but for
 * the signed-in user's phone (SMS/WhatsApp). Sends a code when it opens, auto-
 * verifies on the 6th digit, and refreshes the cached user (phoneVerified) so the
 * gated action can proceed.
 */
export function VerifyPhoneSheet({
  visible,
  phoneNumber,
  onClose,
  onVerified,
}: VerifyPhoneSheetProps) {
  const { updateUser } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Send a code each time the sheet opens (nothing was sent beforehand).
  useEffect(() => {
    if (!visible) return;
    setCode('');
    setError(null);
    setNotice(null);
    setCooldown(RESEND_COOLDOWN);
    let active = true;
    sendPhoneOtp()
      .then((r) => {
        if (!active) return;
        if (r.alreadyVerified) onVerified();
      })
      .catch((e) => active && setError(authErrorMessage(e, 'Could not send a code.')));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const res = await verifyPhoneOtp(value);
      if (res.success) {
        await updateUser(res.user);
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
    if (digits.length === CODE_LENGTH) submit(digits);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setNotice(null);
    try {
      await sendPhoneOtp();
      setNotice('A new code is on its way.');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} onOpened={() => inputRef.current?.focus()}>
      <Text className="text-center text-[20px] font-bold text-gray-900">
        Verify your phone
      </Text>
      <Text className="mb-6 mt-2 text-center text-[14px] leading-5 text-gray-500">
        Enter the 6-digit code we sent to{'\n'}
        <Text className="font-semibold text-gray-700">{phoneNumber || 'your phone'}</Text>
      </Text>

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
              <Text className="text-[22px] font-bold text-gray-900">{code[i] ?? ''}</Text>
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
        <Text className="mt-4 text-center text-[13px] font-medium text-primary">{notice}</Text>
      ) : null}
      {error ? (
        <Text className="mt-4 text-center text-[13px] font-medium text-red-500">{error}</Text>
      ) : null}

      <View className="mt-6">
        <Button label="Verify" loading={submitting} onPress={() => submit(code)} />
        <Pressable
          accessibilityRole="button"
          disabled={cooldown > 0}
          onPress={handleResend}
          className="mt-3 items-center py-1"
        >
          <Text className={`text-[13px] font-semibold ${cooldown > 0 ? 'text-gray-400' : 'text-primary'}`}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
