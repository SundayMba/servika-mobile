import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ProHeader,
  VerificationProgressCard,
  VerificationStepCard,
} from '@/components/artisan/parts';
import { colors } from '@/constants/colors';
import { KYC_STEPS } from '@/lib/artisan/mock';

export default function ProKyc() {
  const router = useRouter();
  const completed = KYC_STEPS.filter((s) => s.status === 'completed').length;
  const allDone = completed === KYC_STEPS.length;

  const reasons = [
    'Build trust with customers',
    'Get more job opportunities',
    'Faster payments & withdrawals',
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ProHeader title="KYC Verification" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
      >
        <VerificationProgressCard completed={completed} total={KYC_STEPS.length} />

        <Text className="mb-2 mt-6 text-[16px] font-bold text-gray-900">Verification Steps</Text>
        <View className="gap-3">
          {KYC_STEPS.map((s) => (
            <VerificationStepCard key={s.id} icon={s.icon} title={s.title} status={s.status} />
          ))}
        </View>

        {/* Why verify */}
        <View className="mt-6 rounded-3xl border border-primary/15 bg-primary/[0.06] p-5">
          <Text className="text-[15px] font-bold text-gray-900">Why verify your account?</Text>
          <View className="mt-3 gap-2.5">
            {reasons.map((r) => (
              <View key={r} className="flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text className="text-[13px] text-gray-600">{r}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/pro/service-setup')}
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
        >
          <Text className="text-[15px] font-bold text-white">
            {allDone ? 'Continue' : 'Complete Verification'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
