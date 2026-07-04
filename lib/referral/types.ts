/** Mirrors the backend ReferralSummaryDto / ReferredArtisanDto. */

import type { ReferralStatus } from '@/lib/referral/mock';

export type ReferredArtisan = {
  id: string;
  name: string;
  trade: string;
  status: ReferralStatus;
  createdAtUtc: string;
};

export type ReferralSummary = {
  code: string;
  rewardNaira: number;
  availableNaira: number;
  paidOutNaira: number;
  pendingCount: number;
  referred: ReferredArtisan[];
};
