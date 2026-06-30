import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountChip, ProHeader, WithdrawalMethodCard } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import {
  EARNINGS,
  QUICK_AMOUNTS,
  WITHDRAWAL_METHODS,
  formatNaira,
} from '@/lib/artisan/mock';

/**
 * Withdraw earnings (11-withdrawal-screen). Mock only — no payout API yet.
 * Method selection + amount input/chips are local state; "Withdraw Now" shows a
 * confirmation and returns to Earnings.
 */
export default function Withdrawal() {
  const router = useRouter();
  const [method, setMethod] = useState(WITHDRAWAL_METHODS[0].id);
  const [amount, setAmount] = useState('50000');

  const onWithdraw = () => {
    Alert.alert(
      'Withdrawal requested',
      `${formatNaira(Number(amount) || 0)} will be sent to your selected account within 24 hours.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
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
            <Text className="mt-1 text-[30px] font-extrabold text-white">{formatNaira(EARNINGS.availableNaira)}</Text>
          </LinearGradient>
        </View>

        {/* Method */}
        <Text className="mb-3 mt-6 text-[15px] font-bold text-gray-900">Select Withdrawal Method</Text>
        {WITHDRAWAL_METHODS.map((m) => (
          <WithdrawalMethodCard
            key={m.id}
            icon={m.icon}
            tint={m.tint}
            name={m.name}
            tail={m.tail}
            selected={method === m.id}
            onPress={() => setMethod(m.id)}
          />
        ))}

        {/* Amount */}
        <Text className="mb-2 mt-3 text-[15px] font-bold text-gray-900">Withdrawal Amount</Text>
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
            active={amount === String(EARNINGS.availableNaira)}
            onPress={() => setAmount(String(EARNINGS.availableNaira))}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onWithdraw}
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
        >
          <Text className="text-[15px] font-bold text-white">Withdraw Now</Text>
        </Pressable>

        <View className="mt-4 flex-row items-center justify-center gap-1.5">
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text className="text-[12px] text-gray-400">Withdrawals are usually processed within 24 hours.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
