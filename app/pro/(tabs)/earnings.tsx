import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PayoutHistoryRow } from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { EARNINGS, PAYOUTS, formatNaira } from '@/lib/artisan/mock';

const TAB_BAR_HEIGHT = 60;

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[15px] font-extrabold text-gray-900">{value}</Text>
      <Text className="mt-0.5 text-[11px] text-gray-400">{label}</Text>
    </View>
  );
}

export default function ProEarnings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPadding = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 py-2">
        <Text className="text-[22px] font-bold text-gray-900">Earnings</Text>
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-1 rounded-full bg-white px-3 py-1.5"
        >
          <Text className="text-[13px] font-semibold text-gray-700">This Month</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPadding }}
      >
        {/* Total earnings hero */}
        <View className="mt-2 overflow-hidden rounded-3xl">
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-[13px] text-white/70">Total Earnings</Text>
                <Text className="mt-1 text-[32px] font-extrabold text-white">
                  {formatNaira(EARNINGS.totalNaira)}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Ionicons name="trending-up" size={14} color="#34D399" />
                  <Text className="text-[12px] font-semibold text-green-400">
                    {EARNINGS.changePct}% from last month
                  </Text>
                </View>
              </View>
              <Ionicons name="stats-chart" size={28} color={colors.primaryLight} />
            </View>
          </LinearGradient>
        </View>

        {/* Mini stats */}
        <View className="mt-3 flex-row rounded-3xl border border-gray-100 bg-white py-4">
          <MiniStat value={String(EARNINGS.completedJobs)} label="Completed Jobs" />
          <View className="w-px bg-gray-100" />
          <MiniStat value={String(EARNINGS.totalHours)} label="Total Hours" />
          <View className="w-px bg-gray-100" />
          <MiniStat value={formatNaira(EARNINGS.avgPerJobNaira)} label="Avg. per Job" />
        </View>

        {/* Recent payouts */}
        <View className="mb-1 mt-6 flex-row items-center justify-between">
          <Text className="text-[16px] font-bold text-gray-900">Recent Payouts</Text>
          <Text className="text-[13px] font-semibold text-primary">View all</Text>
        </View>
        <View className="rounded-3xl border border-gray-100 bg-white px-4">
          {PAYOUTS.map((p, i) => (
            <PayoutHistoryRow key={p.id} payout={p} last={i === PAYOUTS.length - 1} />
          ))}
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
