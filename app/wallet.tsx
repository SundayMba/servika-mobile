import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useAuth } from '@/lib/auth/AuthContext';
import { formatNaira } from '@/lib/catalogue/assets';
import { useWalletTransactions } from '@/lib/payments/hooks';
import type { WalletTransaction } from '@/lib/payments/types';

const TX: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string; tint: string }> = {
  BookingPayment: { icon: 'card', label: 'Booking payment', tint: '#3B82F6' },
  Refund: { icon: 'arrow-undo', label: 'Refund', tint: '#22C55E' },
  Adjustment: { icon: 'swap-horizontal', label: 'Adjustment', tint: '#64748B' },
};
const meta = (t: string) => TX[t] ?? { icon: 'ellipse', label: t, tint: '#64748B' };

function shortDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Wallet() {
  const router = useRouter();
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const { data: txns, isLoading } = useWalletTransactions({ enabled: signedIn });

  const spent = (txns ?? [])
    .filter((t) => t.type === 'BookingPayment')
    .reduce((s, t) => s + Math.abs(t.amountNaira), 0);
  const refunded = (txns ?? [])
    .filter((t) => t.type === 'Refund')
    .reduce((s, t) => s + Math.abs(t.amountNaira), 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View className="flex-row items-center px-5 py-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text className="ml-2 text-[20px] font-bold text-gray-900">Payments</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 32 }}
        >
          {/* Totals */}
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-gray-100 bg-white p-4">
              <Text className="text-[12px] text-gray-500">Total spent</Text>
              <Text className="mt-1 text-[20px] font-extrabold text-gray-900">{formatNaira(spent)}</Text>
            </View>
            <View className="flex-1 rounded-2xl border border-gray-100 bg-white p-4">
              <Text className="text-[12px] text-gray-500">Refunded</Text>
              <Text className="mt-1 text-[20px] font-extrabold text-green-600">{formatNaira(refunded)}</Text>
            </View>
          </View>

          <Text className="mb-2 mt-6 text-[16px] font-bold text-gray-900">Transactions</Text>
          {!txns?.length ? (
            <View className="items-center py-16">
              <Ionicons name="receipt-outline" size={44} color={colors.textMuted} />
              <Text className="mt-3 text-center text-[14px] text-gray-500">
                No payments yet. Your booking payments and refunds will appear here.
              </Text>
            </View>
          ) : (
            <View className="rounded-3xl border border-gray-100 bg-white px-4">
              {txns.map((t, i) => (
                <TxnRow key={t.id} txn={t} last={i === txns.length - 1} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TxnRow({ txn, last }: { txn: WalletTransaction; last: boolean }) {
  const m = meta(txn.type);
  const positive = txn.amountNaira >= 0;
  return (
    <View className={`flex-row items-center py-3 ${last ? '' : 'border-b border-gray-50'}`}>
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${m.tint}1A` }}
      >
        <Ionicons name={m.icon} size={18} color={m.tint} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[14px] font-semibold text-gray-900">{m.label}</Text>
        <Text numberOfLines={1} className="text-[12px] text-gray-400">
          {shortDate(txn.createdAt)}
        </Text>
      </View>
      <Text className={`text-[14px] font-bold ${positive ? 'text-green-600' : 'text-gray-900'}`}>
        {positive ? '+' : '−'}
        {formatNaira(Math.abs(txn.amountNaira))}
      </Text>
    </View>
  );
}
