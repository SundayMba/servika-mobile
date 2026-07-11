import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { formatNaira } from '@/lib/catalogue/assets';
import { useMyReferrals, useRequestReferralWithdrawal } from '@/lib/referral/hooks';

// One referral reward (₦500) is the smallest cash-out — matches the backend floor.
const MIN_WITHDRAWAL = 500;

/**
 * Cash out the referral reward pool to a bank account. The available balance comes
 * from the referral dashboard (ledger-computed); the payout is validated + disbursed
 * server-side. Amount + bank details are local state; "Withdraw Now" fires the real
 * request and refreshes the dashboard.
 */
export default function ReferralWithdraw() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: referral } = useMyReferrals();
  const requestWithdrawal = useRequestReferralWithdrawal();

  const available = referral?.availableNaira ?? 0;

  const [amount, setAmount] = useState(available > 0 ? String(available) : '');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amountNaira = Number(amount) || 0;

  const onWithdraw = async () => {
    setError(null);
    if (amountNaira < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ${formatNaira(MIN_WITHDRAWAL)}.`);
      return;
    }
    if (amountNaira > available) {
      setError(`You can withdraw at most ${formatNaira(available)}.`);
      return;
    }
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setError('Enter your bank name, account number and account name.');
      return;
    }
    try {
      await requestWithdrawal.mutateAsync({
        amountNaira,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });
      Alert.alert(
        'Withdrawal successful',
        `${formatNaira(amountNaira)} is on its way to your ${bankName.trim()} account.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      setError(authErrorMessage(e, 'Could not process the withdrawal.'));
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Navy header */}
      <View style={{ paddingTop: insets.top + 6 }} className="bg-[#0F172A] pb-2">
        <View className="flex-row items-center justify-between px-5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/refer'))}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="text-[16px] font-bold text-white">Withdraw Rewards</Text>
          <View className="h-10 w-10" />
        </View>
      </View>

      <KeyboardAwareScrollView bottomOffset={24}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* Available balance */}
        <View className="overflow-hidden rounded-3xl">
          <LinearGradient colors={['#1E293B', '#0F172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
            <Text className="text-[13px] text-white/70">Referral rewards available</Text>
            <Text className="mt-1 text-[30px] font-extrabold text-white">
              {formatNaira(available)}
            </Text>
          </LinearGradient>
        </View>

        {/* Bank details */}
        <Text className="mb-3 mt-6 text-[15px] font-bold text-gray-900">
          Bank Account
        </Text>
        <Field
          label="Bank name"
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. GTBank"
        />
        <Field
          label="Account number"
          value={accountNumber}
          onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ''))}
          placeholder="0123456789"
          keyboardType="number-pad"
          maxLength={10}
        />
        <Field
          label="Account name"
          value={accountName}
          onChangeText={setAccountName}
          placeholder="As it appears on your account"
        />

        {/* Amount */}
        <Text className="mb-2 mt-3 text-[15px] font-bold text-gray-900">Amount</Text>
        <View className="flex-row items-center rounded-2xl border border-gray-200 bg-white px-4">
          <Text className="text-[18px] font-bold text-gray-400">₦</Text>
          <TextInput
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            className="ml-1 flex-1 py-3.5 text-[18px] font-bold text-gray-900"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setAmount(String(available))}
            disabled={available <= 0}
            hitSlop={8}
            className="rounded-xl px-3 py-1.5"
            style={{ backgroundColor: '#FFEDD5' }}
          >
            <Text className="text-[12px] font-bold text-primary">Max</Text>
          </Pressable>
        </View>

        {error ? (
          <Text className="mt-3 text-[13px] font-medium text-red-500">{error}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onWithdraw}
          disabled={requestWithdrawal.isPending || available <= 0}
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          style={requestWithdrawal.isPending || available <= 0 ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-[15px] font-bold text-white">
            {requestWithdrawal.isPending ? 'Processing…' : 'Withdraw Now'}
          </Text>
        </Pressable>

        <View className="mt-4 flex-row items-center justify-center gap-1.5">
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
          <Text className="text-[12px] text-gray-400">
            Paid to your bank account securely.
          </Text>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[12px] font-medium text-gray-500">{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900"
        {...inputProps}
      />
    </View>
  );
}
