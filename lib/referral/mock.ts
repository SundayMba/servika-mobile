/**
 * Referral program — MOCK data only (UI slice; no backend yet).
 *
 * Launch growth mechanic: a customer refers an artisan and helps guide them
 * through onboarding/KYC (many Lagos artisans can't self-onboard). The referrer
 * earns ₦500 CASH — paid out only once the referred artisan completes their
 * FIRST job (fraud-resistant). Reward is withdrawable to bank.
 *
 * When the backend slice lands, this maps to: a per-user referral code, a
 * `ReferralBonus` wallet ledger entry, and a payout trigger on the referred
 * artisan's first `Completed` booking. Everything here is placeholder state.
 */

/** ₦ earned per successful referral (paid on the artisan's 1st completed job). */
export const REFERRAL_REWARD_NAIRA = 500;

/** Lifecycle of a referred artisan, mirroring the eventual backend states. */
export type ReferralStatus =
  | 'invited' // code shared, artisan hasn't signed up yet
  | 'onboarding' // account created, KYC in progress
  | 'active' // verified & taking jobs, but no completed job yet
  | 'earned' // completed 1st job → ₦500 unlocked
  | 'paid'; // ₦500 withdrawn to bank

export type ReferredArtisan = {
  id: string;
  name: string;
  trade: string;
  status: ReferralStatus;
  /** Human "when this last moved" label. */
  when: string;
};

export type ReferralSummary = {
  code: string;
  /** ₦ available to withdraw now (earned, not yet paid). */
  availableNaira: number;
  /** ₦ paid out to bank so far. */
  paidOutNaira: number;
  /** Count of artisans still moving toward a payout. */
  pendingCount: number;
  referred: ReferredArtisan[];
};

/** Placeholder dashboard state until the referral backend exists. */
export const MOCK_REFERRAL: ReferralSummary = {
  code: 'MODUPE500',
  availableNaira: 1000,
  paidOutNaira: 500,
  pendingCount: 2,
  referred: [
    { id: 'r1', name: 'Tunde Bakare', trade: 'Plumber', status: 'earned', when: '2 days ago' },
    { id: 'r2', name: 'Grace Eze', trade: 'Cleaner', status: 'earned', when: '5 days ago' },
    { id: 'r3', name: 'Sadiq Bello', trade: 'AC Technician', status: 'active', when: '1 week ago' },
    { id: 'r4', name: 'Ifeoma Obi', trade: 'Electrician', status: 'onboarding', when: '1 week ago' },
    { id: 'r5', name: 'Musa Danladi', trade: 'Carpenter', status: 'invited', when: '2 weeks ago' },
    { id: 'r6', name: 'Blessing Ada', trade: 'Painter', status: 'paid', when: '3 weeks ago' },
  ],
};

/** Chip label + colors for a referral status. */
export function referralStatusStyle(status: ReferralStatus): {
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
      return { label: '₦500 ready', tint: '#DCFCE7', color: '#15803D' };
    case 'paid':
      return { label: 'Paid out', tint: '#ECFDF5', color: '#059669' };
  }
}

/** The three-step "how it works" copy for the referral screen. */
export const REFERRAL_STEPS: { icon: string; title: string; body: string }[] = [
  {
    icon: 'share-social-outline',
    title: 'Share your code',
    body: 'Send your referral code to a skilled artisan you know and trust.',
  },
  {
    icon: 'hand-left-outline',
    title: 'Help them onboard',
    body: "Guide them through sign-up and KYC — do it for them if they can't.",
  },
  {
    icon: 'cash-outline',
    title: 'Earn ₦500 cash',
    body: 'Once they finish their first job, ₦500 is yours to withdraw.',
  },
];
