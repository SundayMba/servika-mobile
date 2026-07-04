import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { formatNaira } from '@/lib/artisan/mock';
import {
  useArtisanWallet,
  useArtisanWithdrawals,
} from '@/lib/artisan/walletHooks';
import type { Withdrawal } from '@/lib/artisan/walletTypes';

const TAB_BAR_HEIGHT = 60;

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center px-1">
      <Text className="text-[15px] font-extrabold text-gray-900">{value}</Text>
      <Text className="mt-0.5 text-center text-[11px] text-gray-400">{label}</Text>
    </View>
  );
}

/** "Jul 3, 2026" from an ISO date. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function PayoutRow({ w, last }: { w: Withdrawal; last: boolean }) {
  const paid = w.status === 'Paid';
  const failed = w.status === 'Failed';
  const chip = failed
    ? { bg: 'bg-red-50', text: 'text-red-600' }
    : paid
      ? { bg: 'bg-green-50', text: 'text-green-600' }
      : { bg: 'bg-amber-50', text: 'text-amber-600' };
  return (
    <View
      className={`flex-row items-center justify-between py-3 ${last ? '' : 'border-b border-gray-100'}`}
    >
      <View>
        <Text className="text-[13px] font-medium text-gray-700">
          {w.bankName || 'Bank transfer'} {w.accountNumberMasked}
        </Text>
        <Text className="mt-0.5 text-[11px] text-gray-400">
          {formatDate(w.createdAt)}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="text-[14px] font-bold text-gray-900">
          {formatNaira(w.amountNaira)}
        </Text>
        <View className={`rounded-full px-2 py-0.5 ${chip.bg}`}>
          <Text className={`text-[11px] font-semibold ${chip.text}`}>
            {w.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ProEarnings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

  const walletQuery = useArtisanWallet();
  const withdrawalsQuery = useArtisanWithdrawals();

  const wallet = walletQuery.data;
  const withdrawals = withdrawalsQuery.data ?? [];

  const onRefresh = () => {
    walletQuery.refetch();
    withdrawalsQuery.refetch();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-2">
        <Text className="text-[22px] font-bold text-gray-900">Earnings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={walletQuery.isRefetching || withdrawalsQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Available balance hero */}
        <View className="mt-2 overflow-hidden rounded-3xl">
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-[13px] text-white/70">Available Balance</Text>
                {walletQuery.isLoading ? (
                  <ActivityIndicator color={colors.primaryLight} style={{ marginTop: 12 }} />
                ) : (
                  <Text className="mt-1 text-[32px] font-extrabold text-white">
                    {formatNaira(wallet?.availableNaira ?? 0)}
                  </Text>
                )}
                <Text className="mt-1 text-[12px] text-white/60">
                  {formatNaira(wallet?.totalEarnedNaira ?? 0)} earned all-time
                </Text>
              </View>
              <Ionicons name="wallet" size={28} color={colors.primaryLight} />
            </View>
          </LinearGradient>
        </View>

        {/* Wallet stats — all real, from the ledger */}
        <View className="mt-3 flex-row rounded-3xl border border-gray-100 bg-white py-4">
          <MiniStat value={formatNaira(wallet?.totalEarnedNaira ?? 0)} label="Total Earned" />
          <View className="w-px bg-gray-100" />
          <MiniStat value={formatNaira(wallet?.totalWithdrawnNaira ?? 0)} label="Withdrawn" />
          <View className="w-px bg-gray-100" />
          <MiniStat value={String(withdrawals.length)} label="Payouts" />
        </View>

        {/* Recent payouts */}
        <View className="mb-1 mt-6 flex-row items-center justify-between">
          <Text className="text-[16px] font-bold text-gray-900">Recent Payouts</Text>
        </View>
        <View className="rounded-3xl border border-gray-100 bg-white px-4">
          {withdrawalsQuery.isLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : withdrawals.length === 0 ? (
            <Text className="py-6 text-center text-[13px] text-gray-400">
              No payouts yet. Withdraw your earnings below.
            </Text>
          ) : (
            withdrawals.map((w, i) => (
              <PayoutRow key={w.id} w={w} last={i === withdrawals.length - 1} />
            ))
          )}
        </View>

        {/* Withdraw CTA */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/pro/withdrawal')}
          className="mt-6 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-primary active:opacity-80"
        >
          <Ionicons name="arrow-down-circle-outline" size={20} color={colors.white} />
          <Text className="text-[15px] font-bold text-white">Withdraw Earnings</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
