import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { AppText } from '@/components/ui/AppText';
import { appAlert } from '@/components/ui/AppAlert';
import { BottomSheet } from '@/components/BottomSheet';
import { colors } from '@/constants/colors';
import { authErrorMessage } from '@/lib/api/auth';
import { resolveBankAccount } from '@/lib/api/referrals';
import type { Bank } from '@/lib/artisan/walletTypes';
import { formatNaira } from '@/lib/catalogue/assets';
import { useBanks, useMyReferrals, useRequestReferralWithdrawal } from '@/lib/referral/hooks';

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
  const [bank, setBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // The bank's answer for (bank, number).
  const [lookup, setLookup] = useState<'idle' | 'checking' | 'found' | 'missing' | 'failed'>('idle');
  const [lookedUp, setLookedUp] = useState('');

  useEffect(() => {
    const digits = accountNumber.replace(/\D/g, '');
    if (!bank || digits.length !== 10) {
      if (lookup !== 'idle') setLookup('idle');
      return;
    }
    const key = `${bank.code}|${digits}`;
    if (key === lookedUp) return;
    setLookedUp(key);
    setLookup('checking');
    setAccountName('');
    setError(null);
    let cancelled = false;
    resolveBankAccount(bank.code, digits)
      .then((res) => { if (!cancelled) { setAccountName(res.accountName); setLookup('found'); } })
      .catch((e: unknown) => {
        if (cancelled) return;
        const status = (e as { response?: { status?: number } })?.response?.status;
        setLookup(status === 404 ? 'missing' : 'failed');
        setError(status === 404 ? 'No account with that number at this bank. Check the digits.' : status === 429 ? 'That is enough account checks for today. Try again tomorrow.' : 'Could not reach the bank. Try again in a moment.');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank?.code, accountNumber]);

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
    if (!bank || accountNumber.replace(/\D/g, '').length !== 10) {
      setError('Choose your bank and enter your ten-digit account number.');
      return;
    }
    if (lookup !== 'found' || !accountName.trim()) {
      setError(lookup === 'checking' ? 'One moment, the bank is still answering.' : 'We could not confirm this account. Check the number.');
      return;
    }
    try {
      await requestWithdrawal.mutateAsync({
        amountNaira,
        bankName: bank.name,
        bankCode: bank.code,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      });
      appAlert(
        'Withdrawal requested',
        `${formatNaira(amountNaira)} is on its way to your ${bank.name} account. Bank transfers usually arrive within minutes. We'll notify you once it lands.`,
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
          <AppText weight="semibold" className="text-[16px] text-white">Withdraw Rewards</AppText>
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
            <AppText className="text-[13px] text-white/70">Referral rewards available</AppText>
            <AppText weight="semibold" className="mt-1 text-[30px] text-white">
              {formatNaira(available)}
            </AppText>
          </LinearGradient>
        </View>

        {/* Bank details */}
        <AppText weight="semibold" className="mb-3 mt-6 text-[15px] text-gray-900">
          Bank Account
        </AppText>
        <View className="mb-3">
          <AppText weight="medium" className="mb-1.5 text-[12px] text-gray-500">Bank</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPickerOpen(true)}
            className="flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5 active:bg-gray-50"
          >
            <AppText className={`text-[15px] ${bank ? 'text-gray-900' : 'text-gray-400'}`}>
              {bank?.name ?? 'Select your bank'}
            </AppText>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
        <Field
          label="Account number"
          value={accountNumber}
          onChangeText={(t) => setAccountNumber(t.replace(/[^0-9]/g, ''))}
          placeholder="0123456789"
          keyboardType="number-pad"
          maxLength={10}
        />
        <View className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
          <AppText className="text-[11px] uppercase tracking-wider text-gray-400">Account name</AppText>
          <AppText weight="semibold" className={`mt-1 text-[15px] ${lookup === 'found' ? 'text-gray-900' : 'text-gray-400'}`}>
            {lookup === 'found' ? accountName : lookup === 'checking' ? 'Asking the bank' : lookup === 'missing' ? 'No account with that number' : lookup === 'failed' ? 'Could not reach the bank' : 'Filled in by the bank once the number is complete'}
          </AppText>
          {lookup === 'found' ? <AppText className="mt-1 text-[12px] text-gray-500">Not you? Check the number. The name comes straight from {bank?.name}.</AppText> : null}
        </View>

        {/* Amount */}
        <AppText weight="semibold" className="mb-2 mt-3 text-[15px] text-gray-900">Amount</AppText>
        <View className="flex-row items-center rounded-2xl border border-gray-200 bg-white px-4">
          <AppText weight="semibold" className="text-[18px] text-gray-400">₦</AppText>
          <AppTextInput weight="semibold"
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            className="ml-1 flex-1 py-3.5 text-[18px] text-gray-900"
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setAmount(String(available))}
            disabled={available <= 0}
            hitSlop={8}
            className="rounded-xl px-3 py-1.5"
            style={{ backgroundColor: '#FFEDD5' }}
          >
            <AppText weight="semibold" className="text-[12px] text-primary">Max</AppText>
          </Pressable>
        </View>

        {error ? (
          <AppText weight="medium" className="mt-3 text-[13px] text-red-500">{error}</AppText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onWithdraw}
          disabled={requestWithdrawal.isPending || available <= 0}
          className="mt-6 h-14 items-center justify-center rounded-2xl bg-primary active:opacity-80"
          style={requestWithdrawal.isPending || available <= 0 ? { opacity: 0.6 } : undefined}
        >
          <AppText weight="semibold" className="text-[15px] text-white">
            {requestWithdrawal.isPending ? 'Processing…' : 'Withdraw Now'}
          </AppText>
        </Pressable>

        <View className="mt-4 flex-row items-center justify-center gap-1.5">
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
          <AppText className="text-[12px] text-gray-400">
            Paid to your bank account securely.
          </AppText>
        </View>
      </KeyboardAwareScrollView>

      <BankPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(b) => {
          setBank(b);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}

/** Searchable bank list in a bottom sheet. */
function BankPickerSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (bank: Bank) => void;
}) {
  const { data: banks, isLoading } = useBanks();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = banks ?? [];
    return q ? list.filter((b) => b.name.toLowerCase().includes(q)) : list;
  }, [banks, query]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="px-5 pb-4 pt-1">
        <AppText weight="semibold" className="text-[18px] text-gray-900">Choose your bank</AppText>
        <View className="mt-3 flex-row items-center rounded-2xl border border-gray-200 bg-white px-3">
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <AppTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search banks"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            className="ml-2 flex-1 py-3 text-[14px] text-gray-900"
          />
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 320 }}
          className="mt-3"
        >
          {isLoading ? (
            <AppText className="py-6 text-center text-[13px] text-gray-400">Loading banks…</AppText>
          ) : filtered.length === 0 ? (
            <AppText className="py-6 text-center text-[13px] text-gray-400">No banks match.</AppText>
          ) : (
            filtered.map((b) => (
              <Pressable
                key={b.code}
                accessibilityRole="button"
                onPress={() => onSelect(b)}
                className="flex-row items-center border-b border-gray-100 py-3.5 active:opacity-60"
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Ionicons name="business-outline" size={16} color={colors.primary} />
                </View>
                <AppText weight="medium" className="ml-3 flex-1 text-[14px] text-gray-800">{b.name}</AppText>
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
}

function Field({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-3">
      <AppText weight="medium" className="mb-1.5 text-[12px] text-gray-500">{label}</AppText>
      <AppTextInput
        placeholderTextColor={colors.textMuted}
        className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] text-gray-900"
        {...inputProps}
      />
    </View>
  );
}
