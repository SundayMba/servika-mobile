import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { artisanAvatar, categoryImage } from '@/lib/catalogue/assets';
import { formatNaira, type JobRequest, type Payout, type ProgressStep } from '@/lib/artisan/mock';

type IconName = keyof typeof Ionicons.glyphMap;

/** Shared back-button + title header for the white "Pro" stack screens. */
export function ProHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View className="flex-row items-center px-5 py-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={onBack ?? (() => router.back())}
        className="h-10 w-10 items-center justify-center rounded-full bg-background"
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text className="ml-2 flex-1 text-[20px] font-bold text-gray-900">{title}</Text>
      {right}
    </View>
  );
}

/** Trust pill row (background-checked / ID-verified). Mirrors the customer side. */
export function ProVerifiedBadge({ label = 'Verified Artisan' }: { label?: string }) {
  return (
    <View className="flex-row items-center gap-1 self-start rounded-full bg-primary/10 px-3 py-1">
      <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
      <Text className="text-[11px] font-semibold text-primary">{label}</Text>
    </View>
  );
}

/* ── Onboarding / KYC ─────────────────────────────────────────────── */

/** Bulleted selling point on the onboarding hero. */
export function ArtisanOnboardingHero() {
  const points = [
    'Get more job opportunities',
    'Manage jobs with ease',
    'Get paid securely',
  ];
  return (
    <View>
      <Text className="text-[30px] font-extrabold leading-[38px] text-white">
        Join thousands of skilled artisans building their business with Servika.
      </Text>
      <View className="mt-7 gap-3">
        {points.map((p) => (
          <View key={p} className="flex-row items-center gap-3">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
              <Ionicons name="checkmark" size={14} color={colors.white} />
            </View>
            <Text className="text-[15px] text-white/90">{p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** One KYC step row with a status check. */
export function VerificationStepCard({
  icon,
  title,
  status,
}: {
  icon: IconName;
  title: string;
  status: 'completed' | 'pending';
}) {
  const done = status === 'completed';
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-gray-900">{title}</Text>
        <Text className={done ? 'text-[12px] text-green-600' : 'text-[12px] text-amber-600'}>
          {done ? 'Completed' : 'Pending'}
        </Text>
      </View>
      <View
        className={
          done
            ? 'h-7 w-7 items-center justify-center rounded-full bg-green-500'
            : 'h-7 w-7 items-center justify-center rounded-full border-2 border-gray-200'
        }
      >
        {done ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
      </View>
    </View>
  );
}

/** Verification progress card (n of m completed + bar). */
export function VerificationProgressCard({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = Math.round((completed / total) * 100);
  return (
    <View className="rounded-3xl border border-primary/15 bg-primary/[0.06] p-5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[16px] font-bold text-gray-900">
            Complete verification to start getting jobs
          </Text>
          <Text className="mt-1 text-[13px] text-gray-500">
            {completed} of {total} completed
          </Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-green-500">
          <Ionicons name="shield-checkmark" size={22} color={colors.white} />
        </View>
      </View>
      <View className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
        <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </View>
      <Text className="mt-1.5 text-right text-[12px] font-semibold text-primary">{pct}%</Text>
    </View>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────── */

/** One metric inside the dashboard overview card (on a navy background). */
export function DashboardMetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[20px] font-extrabold text-white">{value}</Text>
      <Text className="mt-0.5 text-[11px] text-white/70">{label}</Text>
    </View>
  );
}

/** A row in Today's Schedule. */
export function TodayScheduleCard({
  time,
  service,
  area,
  tone,
}: {
  time: string;
  service: string;
  area: string;
  tone: 'confirmed' | 'upcoming';
}) {
  return (
    <View className="flex-row items-center border-t border-gray-100 py-3">
      <View className="w-[72px]">
        <Text className="text-[13px] font-bold text-gray-900">{time}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-gray-900">{service}</Text>
        <Text className="text-[12px] text-gray-500">{area}</Text>
      </View>
      <View className={tone === 'confirmed' ? 'rounded-full bg-green-50 px-2.5 py-1' : 'rounded-full bg-primary/10 px-2.5 py-1'}>
        <Text className={tone === 'confirmed' ? 'text-[11px] font-semibold text-green-600' : 'text-[11px] font-semibold text-primary'}>
          {tone === 'confirmed' ? 'Confirmed' : 'Upcoming'}
        </Text>
      </View>
    </View>
  );
}

/* ── Job requests ─────────────────────────────────────────────────── */

/** A category-image thumbnail with a graceful tinted fallback. */
function ServiceThumb({ imageKey, size = 48 }: { imageKey?: string; size?: number }) {
  const img = imageKey ? categoryImage(imageKey) : undefined;
  if (img) {
    return (
      <Image
        source={img}
        style={{ width: size, height: size, borderRadius: 12 }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center rounded-xl bg-primary/10"
    >
      <Ionicons name="construct" size={20} color={colors.primary} />
    </View>
  );
}

/** Incoming job request card with Decline / Accept actions. */
export function JobRequestCard({
  job,
  onPress,
  onAccept,
  onDecline,
}: {
  job: JobRequest;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="rounded-3xl border border-gray-100 bg-white p-4 active:opacity-90"
    >
      <View className="flex-row">
        <ServiceThumb imageKey={job.imageKey} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 pr-2 text-[15px] font-bold text-gray-900">{job.service}</Text>
            {job.isNew ? (
              <View className="rounded-full bg-primary/10 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-primary">New</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-[12px] text-gray-500">{job.area}</Text>
          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-[15px] font-extrabold text-gray-900">{formatNaira(job.amountNaira)}</Text>
            {job.distanceKm != null ? (
              <Text className="text-[12px] text-gray-400">{job.distanceKm} km away</Text>
            ) : null}
          </View>
          {job.when ? <Text className="mt-0.5 text-[12px] text-gray-400">{job.when}</Text> : null}
        </View>
      </View>

      {(onAccept || onDecline) && (
        <View className="mt-3 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={onDecline}
            className="h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white active:opacity-70"
          >
            <Text className="text-[14px] font-semibold text-gray-700">Decline</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onAccept}
            className="h-11 flex-1 items-center justify-center rounded-xl bg-primary active:opacity-80"
          >
            <Text className="text-[14px] font-bold text-white">Accept</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

/** Compact preview row for the dashboard "Incoming Requests" section. */
export function IncomingRequestPreview({
  job,
  onAccept,
  onDecline,
}: {
  job: JobRequest;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center">
        <ServiceThumb imageKey={job.imageKey} size={44} />
        <View className="ml-3 flex-1">
          <Text className="text-[14px] font-bold text-gray-900">{job.service}</Text>
          <Text className="text-[12px] text-gray-500">{job.area}</Text>
        </View>
        {job.distanceKm != null ? (
          <Text className="text-[12px] text-gray-400">{job.distanceKm} km</Text>
        ) : null}
      </View>
      <Text className="mt-1 text-[15px] font-extrabold text-gray-900">{formatNaira(job.amountNaira)}</Text>
      <View className="mt-3 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={onDecline}
          className="h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 active:opacity-70"
        >
          <Text className="text-[13px] font-semibold text-gray-700">Decline</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onAccept}
          className="h-10 flex-1 items-center justify-center rounded-xl bg-primary active:opacity-80"
        >
          <Text className="text-[13px] font-bold text-white">Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ── Job detail / navigation ──────────────────────────────────────── */

/** A label/value row used in the job-details section. */
export function JobDetailSection({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white">
      {rows.map((r, i) => (
        <View
          key={r.label}
          className={`flex-row items-center justify-between px-4 py-3.5 ${i === rows.length - 1 ? '' : 'border-b border-gray-100'}`}
        >
          <Text className="text-[13px] text-gray-500">{r.label}</Text>
          <Text className="max-w-[60%] text-right text-[13px] font-semibold text-gray-900">{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Job progress / completion ────────────────────────────────────── */

/** Vertical job timeline (Arrived → Diagnosing → Work → Completed). */
export function ArtisanJobTimeline({ steps }: { steps: ProgressStep[] }) {
  return (
    <View>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const done = s.state === 'done';
        const active = s.state === 'current';
        return (
          <View key={s.id} className="flex-row">
            <View className="items-center">
              <View
                className={
                  done
                    ? 'h-7 w-7 items-center justify-center rounded-full bg-green-500'
                    : active
                      ? 'h-7 w-7 items-center justify-center rounded-full bg-primary'
                      : 'h-7 w-7 items-center justify-center rounded-full border-2 border-gray-200 bg-white'
                }
              >
                {done ? (
                  <Ionicons name="checkmark" size={15} color={colors.white} />
                ) : active ? (
                  <View className="h-2.5 w-2.5 rounded-full bg-white" />
                ) : (
                  <Text className="text-[11px] font-bold text-gray-400">{i + 1}</Text>
                )}
              </View>
              {!last && (
                <View className={`my-0.5 w-0.5 flex-1 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </View>
            <View className={`ml-3 flex-1 ${last ? '' : 'pb-5'}`}>
              <View className="flex-row items-center justify-between">
                <Text className={`text-[14px] font-semibold ${active ? 'text-primary' : 'text-gray-900'}`}>
                  {s.title}
                </Text>
                {s.time ? (
                  <Text className={`text-[12px] ${active ? 'font-semibold text-primary' : 'text-gray-400'}`}>
                    {s.time}
                  </Text>
                ) : null}
              </View>
              <Text className="text-[12px] text-gray-500">{s.detail}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Elapsed-time card with a pause-timer placeholder. */
export function ElapsedTimeCard({
  elapsed,
  onPause,
}: {
  elapsed: string;
  onPause?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
      <View>
        <Text className="text-[12px] text-gray-500">Elapsed Time</Text>
        <Text className="text-[26px] font-extrabold tracking-wide text-gray-900">{elapsed}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onPause}
        className="flex-row items-center gap-1.5 rounded-xl border border-primary/30 px-4 py-2.5 active:opacity-70"
      >
        <Ionicons name="pause" size={16} color={colors.primary} />
        <Text className="text-[13px] font-semibold text-primary">Pause Timer</Text>
      </Pressable>
    </View>
  );
}

/** Job summary card on the completion screen. */
export function CompletionSummaryCard({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <View className="rounded-2xl border border-gray-100 bg-white p-4">
      <Text className="mb-1 text-[14px] font-bold text-gray-900">Job Summary</Text>
      {rows.map((r) => (
        <View key={r.label} className="flex-row items-center justify-between border-t border-gray-100 py-3">
          <Text className="text-[13px] text-gray-500">{r.label}</Text>
          <Text className="text-[13px] font-semibold text-gray-900">{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── Earnings / withdrawal ────────────────────────────────────────── */

/** A recent-payout row. */
export function PayoutHistoryRow({ payout, last }: { payout: Payout; last?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${last ? '' : 'border-b border-gray-100'}`}>
      <Text className="text-[13px] text-gray-500">{payout.date}</Text>
      <View className="flex-row items-center gap-3">
        <Text className="text-[14px] font-bold text-gray-900">{formatNaira(payout.amountNaira)}</Text>
        <View className={payout.status === 'Paid' ? 'rounded-full bg-green-50 px-2 py-0.5' : 'rounded-full bg-amber-50 px-2 py-0.5'}>
          <Text className={payout.status === 'Paid' ? 'text-[11px] font-semibold text-green-600' : 'text-[11px] font-semibold text-amber-600'}>
            {payout.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Selectable withdrawal-method row (radio on the right). */
export function WithdrawalMethodCard({
  icon,
  tint,
  name,
  tail,
  selected,
  onPress,
}: {
  icon: IconName;
  tint: string;
  name: string;
  tail: string;
  selected: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`mb-3 flex-row items-center rounded-2xl border bg-white p-4 ${selected ? 'border-primary' : 'border-gray-100'}`}
    >
      <View style={{ backgroundColor: `${tint}1A` }} className="h-10 w-10 items-center justify-center rounded-xl">
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[14px] font-semibold text-gray-900">{name}</Text>
        <Text className="text-[12px] text-gray-400">•••• {tail}</Text>
      </View>
      <View className={selected ? 'h-5 w-5 items-center justify-center rounded-full border-[6px] border-primary' : 'h-5 w-5 rounded-full border-2 border-gray-300'} />
    </Pressable>
  );
}

/** Quick-amount chip on the withdrawal screen. */
export function AmountChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-1 items-center justify-center rounded-xl border py-3 active:opacity-70 ${active ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'}`}
    >
      <Text className={active ? 'text-[13px] font-bold text-primary' : 'text-[13px] font-semibold text-gray-700'}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ── Profile ──────────────────────────────────────────────────────── */

/** Artisan profile identity header (avatar + name + rating). */
export function ArtisanProfileHeader({
  name,
  specialty,
  rating,
  reviewCount,
  imageKey,
  verified,
}: {
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  imageKey: string;
  verified: boolean;
}) {
  const avatar = artisanAvatar(imageKey);
  return (
    <View className="flex-row items-center">
      {avatar ? (
        <Image source={avatar} style={{ width: 64, height: 64, borderRadius: 32 }} contentFit="cover" />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
      )}
      <View className="ml-4 flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[18px] font-bold text-gray-900">{name}</Text>
          {verified ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
        </View>
        <Text className="text-[13px] text-gray-500">{specialty}</Text>
        <View className="mt-0.5 flex-row items-center gap-1">
          <Ionicons name="star" size={13} color={colors.primary} />
          <Text className="text-[13px] text-gray-600">
            {rating.toFixed(1)} ({reviewCount} reviews)
          </Text>
        </View>
      </View>
    </View>
  );
}

/** A tappable row in the artisan profile menu. */
export function ArtisanProfileMenuRow({
  icon,
  label,
  detail,
  onPress,
  last,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`flex-row items-center gap-3 py-3.5 active:opacity-60 ${last ? '' : 'border-b border-gray-100'}`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-medium text-gray-800">{label}</Text>
        {detail ? <Text className="text-[12px] text-gray-400">{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

/** "View Public Profile" outline button. */
export function PublicProfileButton({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="mt-2 h-14 flex-row items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/[0.06] active:opacity-80"
    >
      <Text className="text-[15px] font-bold text-primary">View Public Profile</Text>
      <Ionicons name="open-outline" size={18} color={colors.primary} />
    </Pressable>
  );
}
