import { formatNaira } from '@/lib/catalogue/assets';

/**
 * Referral screen copy and status chips. The reward amount is never hard-coded:
 * it comes from the referral summary (or the fee schedule) so it follows the
 * admin setting.
 */

/** Lifecycle of a referred artisan, as the backend reports it. */
export type ReferralStatus =
  | 'invited' // code shared, artisan hasn't signed up yet
  | 'onboarding' // account created, verification in progress
  | 'active' // verified & taking jobs, but no completed job yet
  | 'earned' // completed 1st job → reward unlocked
  | 'paid'; // reward withdrawn to bank

/** Chip label + colors for a referral status. */
export function referralStatusStyle(
  status: ReferralStatus,
  rewardNaira?: number | null,
): {
  label: string;
  tint: string;
  color: string;
} {
  switch (status) {
    case 'invited':
      return { label: 'Invited', tint: '#F1F5F9', color: '#64748B' };
    case 'onboarding':
      return { label: 'Onboarding', tint: '#FEF3C7', color: '#B45309' };
    case 'active':
      return { label: 'Working', tint: '#DBEAFE', color: '#1D4ED8' };
    case 'earned':
      return {
        label: rewardNaira ? `${formatNaira(rewardNaira)} ready` : 'Reward ready',
        tint: '#DCFCE7',
        color: '#15803D',
      };
    case 'paid':
      return { label: 'Paid out', tint: '#ECFDF5', color: '#059669' };
    default:
      return { label: 'Referred', tint: '#F1F5F9', color: '#64748B' };
  }
}

/** The three-step "how it works" copy for the referral screen. */
export function referralSteps(
  rewardNaira: number | null | undefined,
): { icon: string; title: string; body: string }[] {
  const reward = rewardNaira ? formatNaira(rewardNaira) : 'your reward';
  return [
    {
      icon: 'share-social-outline',
      title: 'Share your code',
      body: 'Send your referral code to a skilled artisan you know and trust.',
    },
    {
      icon: 'hand-left-outline',
      title: 'Help them onboard',
      body: 'They enter your code when they sign up on Servika Pro. Help them get verified.',
    },
    {
      icon: 'cash-outline',
      title: rewardNaira ? `Earn ${reward} cash` : 'Earn cash',
      body: `Once they finish their first job, ${reward} is yours to withdraw.`,
    },
  ];
}
