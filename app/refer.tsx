import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { formatNaira } from '@/lib/catalogue/assets';
import { timeAgo } from '@/lib/notifications/hooks';
import { useMyReferrals } from '@/lib/referral/hooks';
import { REFERRAL_STEPS, referralStatusStyle } from '@/lib/referral/mock';
import type { ReferredArtisan } from '@/lib/referral/types';

/**
 * Referral program screen — refer an artisan, help them onboard, earn ₦500 cash
 * once they finish their first job. Reads the live referral dashboard; cash-out
 * lands with the referral-withdrawal step.
 */
export default function Refer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: referral } = useMyReferrals();
  const data = referral ?? {
    code: '—',
    rewardNaira: 500,
    availableNaira: 0,
    paidOutNaira: 0,
    pendingCount: 0,
    referred: [],
  };
  const [copied, setCopied] = useState(false);

  const shareMessage = useMemo(
    () =>
      `Join Servika as an artisan and get more paid jobs near you! Use my code ${data.code} when you sign up. I'll help you set up. 🧰`,
    [data.code],
  );

  const onCopy = async () => {
    if (data.code === '—') return;
    await Clipboard.setStringAsync(data.code);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const onShare = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const onWithdraw = () => {
    if (data.availableNaira <= 0) return;
    router.push('/referral-withdraw');
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      {/* ── Navy hero ── */}
      <View style={{ paddingTop: insets.top + 6 }} className="bg-[#0F172A]">
        <View className="flex-row items-center justify-between px-5 pb-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/home')
            }
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="text-[16px] font-bold text-white">Refer & Earn</Text>
          <View className="h-10 w-10" />
        </View>

        <View className="items-center px-6 pb-7 pt-2">
          <View
            className="h-16 w-16 items-center justify-center rounded-3xl"
            style={{ backgroundColor: 'rgba(249,115,22,0.18)' }}
          >
            <Ionicons name="gift" size={32} color={colors.primary} />
          </View>
          <Text className="mt-4 text-center text-[22px] font-extrabold text-white">
            Earn {formatNaira(data.rewardNaira)} per artisan
          </Text>
          <Text className="mt-1.5 text-center text-[13px] leading-5 text-white/60">
            Bring skilled artisans onto Servika and help them get started. You
            get paid when they complete their first job.
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* ── Earnings summary (pulled up over the hero) ── */}
        <View className="-mt-4 px-5">
          <View
            className="flex-row overflow-hidden rounded-3xl bg-white"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 3,
            }}
          >
            <View className="flex-1 items-center py-4">
              <Text className="text-[20px] font-extrabold text-gray-900">
                {formatNaira(data.availableNaira)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-gray-500">Available</Text>
            </View>
            <View className="my-3 w-px bg-gray-100" />
            <View className="flex-1 items-center py-4">
              <Text className="text-[20px] font-extrabold text-gray-900">
                {formatNaira(data.paidOutNaira)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-gray-500">Paid out</Text>
            </View>
            <View className="my-3 w-px bg-gray-100" />
            <View className="flex-1 items-center py-4">
              <Text className="text-[20px] font-extrabold text-gray-900">
                {data.pendingCount}
              </Text>
              <Text className="mt-0.5 text-[11px] text-gray-500">Pending</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Withdraw earnings"
            onPress={onWithdraw}
            disabled={data.availableNaira <= 0}
            className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-2xl"
            style={{
              backgroundColor:
                data.availableNaira > 0 ? colors.primary : '#E2E6ED',
            }}
          >
            <Ionicons
              name="cash-outline"
              size={18}
              color={data.availableNaira > 0 ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              className="text-[14px] font-bold"
              style={{
                color: data.availableNaira > 0 ? '#FFFFFF' : colors.textMuted,
              }}
            >
              Withdraw {formatNaira(data.availableNaira)}
            </Text>
          </Pressable>
        </View>

        {/* ── Referral code ── */}
        <View className="mt-6 px-5">
          <Text className="mb-2 text-[13px] font-semibold text-gray-500">
            YOUR REFERRAL CODE
          </Text>
          <View className="overflow-hidden rounded-3xl border border-dashed border-primary/40 bg-white">
            <LinearGradient
              colors={['#FFF4EC', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="flex-row items-center justify-between px-5 py-4">
                <Text className="text-[24px] font-extrabold tracking-widest text-gray-900">
                  {data.code}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copy referral code"
                  onPress={onCopy}
                  className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
                  style={{ backgroundColor: copied ? '#DCFCE7' : '#FFEDD5' }}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={15}
                    color={copied ? '#15803D' : colors.primary}
                  />
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: copied ? '#15803D' : colors.primary }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share referral code"
            onPress={onShare}
            className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-[#0F172A]"
          >
            <Ionicons name="share-social" size={18} color="#FFFFFF" />
            <Text className="text-[14px] font-bold text-white">
              Share invite
            </Text>
          </Pressable>
        </View>

        {/* ── How it works ── */}
        <View className="mt-7 px-5">
          <Text className="mb-3 text-[17px] font-bold text-gray-900">
            How it works
          </Text>
          <View className="rounded-3xl border border-gray-100 bg-white px-4 py-2">
            {REFERRAL_STEPS.map((step, i) => (
              <View
                key={step.title}
                className={`flex-row items-start gap-3 py-3 ${i < REFERRAL_STEPS.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: '#FFEDD5' }}
                >
                  <Ionicons
                    name={step.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View className="flex-1 pt-0.5">
                  <Text className="text-[14px] font-semibold text-gray-900">
                    {step.title}
                  </Text>
                  <Text className="mt-0.5 text-[12px] leading-4 text-gray-500">
                    {step.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Referred artisans ── */}
        <View className="mt-7 px-5">
          <Text className="mb-3 text-[17px] font-bold text-gray-900">
            Your referrals ({data.referred.length})
          </Text>
          <View className="rounded-3xl border border-gray-100 bg-white px-4 py-1">
            {data.referred.map((artisan, i) => (
              <ReferralRow
                key={artisan.id}
                artisan={artisan}
                last={i === data.referred.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ReferralRow({
  artisan,
  last,
}: {
  artisan: ReferredArtisan;
  last: boolean;
}) {
  const chip = referralStatusStyle(artisan.status);
  const initials = artisan.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <View
      className={`flex-row items-center py-3 ${last ? '' : 'border-b border-gray-100'}`}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: '#F1F5F9' }}
      >
        <Text className="text-[13px] font-bold text-gray-600">{initials}</Text>
      </View>
      <View className="flex-1 px-3">
        <Text className="text-[14px] font-semibold text-gray-900">
          {artisan.name}
        </Text>
        <Text className="mt-0.5 text-[11px] text-gray-400">
          {artisan.trade} · {timeAgo(artisan.createdAtUtc)}
        </Text>
      </View>
      <View
        className="rounded-full px-2.5 py-1"
        style={{ backgroundColor: chip.tint }}
      >
        <Text className="text-[11px] font-bold" style={{ color: chip.color }}>
          {chip.label}
        </Text>
      </View>
    </View>
  );
}
