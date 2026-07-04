import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountChip, ProHeader } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { formatNaira } from '@/lib/artisan/mock';
import {
  useArtisanWallet,
  useRequestWithdrawal,
} from '@/lib/artisan/walletHooks';

const MIN_WITHDRAWAL = 1000;
const QUICK_AMOUNTS = [1000, 5000, 10000] as const;

/**
 * Withdraw earnings to a bank account. Balance comes from the artisan wallet
 * (ledger-computed); the payout is validated + disbursed server-side. Amount +
 * bank details are local state; "Withdraw Now" fires the real request.
 */
export default function Withdrawal() {
  const router = useRouter();
  const walletQuery = useArtisanWallet();
  const requestWithdrawal = useRequestWithdrawal();

  const available = walletQuery.data?.availableNaira ?? 0;

  const [amount, setAmount] = useState('');
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ProHeader title="Withdraw Earnings" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
      >
        {/* Available balance */}
        <View className="overflow-hidden rounded-3xl">
          <LinearGradient colors={['#1E293B', '#0F172A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 20 }}>
            <Text className="text-[13px] text-white/70">Available Balance</Text>
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
        </View>

        <View className="mt-3 flex-row gap-2.5">
          {QUICK_AMOUNTS.map((a) => (
            <AmountChip
              key={a}
              label={formatNaira(a)}
              active={amount === String(a)}
              onPress={() => setAmount(String(a))}
            />
          ))}
          <AmountChip
            label="Max"
            active={amount === String(available)}
            onPress={() => setAmount(String(available))}
          />
        </View>

        {error ? (
          <Text className="mt-3 text-[13px] font-medium text-red-500">{error}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onWithdraw}
          disabled={requestWithdrawal.isPending}
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          style={requestWithdrawal.isPending ? { opacity: 0.6 } : undefined}
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
      </ScrollView>
    </SafeAreaView>
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
