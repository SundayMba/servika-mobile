/**
 * Placeholder data for the artisan ("Servika Pro") side of the app — batch-5.
 *
 * These screens are high-fidelity UI built ahead of their backend slices: the
 * artisan booking-transition endpoints, live tracking (SignalR), real earnings
 * and withdrawals all land later. Until then the screens render this mock so the
 * provider flow is fully walkable. Accept/decline, progress steps and withdrawals
 * mutate local component state only — nothing is persisted.
 *
 * Re-skinned to the orange/navy Servika brand (the batch-5 mockups are drawn in
 * deep-purple — same convention as the customer re-skin).
 */

import type { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

/** The signed-in artisan (mirrors 12-artisan-profile + 04-dashboard). */
export const MOCK_ME = {
  name: 'John Artisan',
  specialty: 'Plumbing Specialist',
  imageKey: 'ibrahim-yusuf', // resolves to a bundled avatar via lib/catalogue/assets
  rating: 4.8,
  reviewCount: 124,
  serviceAreas: 'Lagos Island, Lekki, VI',
  verified: true,
};

/** Top-line dashboard counters. */
export const DASHBOARD_STATS = {
  jobs: 8,
  completed: 5,
  earningsNaira: 65000,
};

export type JobRequest = {
  id: string;
  service: string;
  area: string;
  amountNaira: number;
  /** Distance from the customer. Absent for live jobs (the API summary has none). */
  distanceKm?: number;
  when: string;
  imageKey?: string; // catalogue category slug for the thumbnail
  isNew?: boolean;
};

/** Incoming job requests (05-incoming-job-requests + dashboard preview). */
export const INCOMING_REQUESTS: JobRequest[] = [
  { id: 'SRV-12345', service: 'Plumbing Repair', area: 'Lekki Phase 1, Lagos', amountNaira: 18000, distanceKm: 2.1, when: 'Today, 9:30 AM', imageKey: 'plumbing', isNew: true },
  { id: 'SRV-12346', service: 'Electrical Installation', area: 'Ajah, Lagos', amountNaira: 25000, distanceKm: 5.1, when: 'Today, 10:15 AM', imageKey: 'electrical', isNew: true },
  { id: 'SRV-12347', service: 'AC Servicing', area: 'Victoria Island, Lagos', amountNaira: 22000, distanceKm: 2.8, when: 'Today, 11:00 AM', imageKey: 'ac', isNew: true },
];

export const ACCEPTED_JOBS: JobRequest[] = [
  { id: 'SRV-12340', service: 'Generator Repair', area: 'Ikoyi, Lagos', amountNaira: 30000, distanceKm: 3.4, when: 'Today, 1:00 PM', imageKey: 'generator' },
];

export const HISTORY_JOBS: JobRequest[] = [
  { id: 'SRV-12001', service: 'House Cleaning', area: 'Yaba, Lagos', amountNaira: 10000, distanceKm: 6.2, when: 'May 14, 2026', imageKey: 'cleaning' },
  { id: 'SRV-12002', service: 'Appliance Repair', area: 'Surulere, Lagos', amountNaira: 14000, distanceKm: 4.0, when: 'May 12, 2026', imageKey: 'appliance' },
];

/** Full detail for the job-details / accept screen + customer note. */
export const JOB_DETAIL = {
  id: 'SRV-12345',
  service: 'Plumbing Repair',
  area: 'Lekki Phase 1, Lagos',
  amountNaira: 18000,
  distanceKm: 2.1,
  customer: 'Sarah Johnson',
  when: 'Today, 9:30 AM',
  description: 'Fix leaking pipe in the kitchen and replace the broken tap.',
  customerNote: 'Please come prepared with all necessary tools.',
  isNew: true,
};

export type ScheduleItem = {
  id: string;
  time: string;
  service: string;
  area: string;
  tone: 'confirmed' | 'upcoming';
};

/** Today's schedule preview on the dashboard. */
export const TODAY_SCHEDULE: ScheduleItem[] = [
  { id: '1', time: '10:00 AM', service: 'Electrical Repair', area: 'Lekki Phase 1', tone: 'confirmed' },
  { id: '2', time: '1:00 PM', service: 'AC Maintenance', area: 'Ikoyi, Lagos', tone: 'upcoming' },
];

export type ArtisanService = {
  id: string;
  name: string;
  subtitle: string;
  priceNaira: number;
  imageKey: string; // catalogue category slug
  enabled: boolean;
};

/** Services the artisan offers (03-service-setup) — toggles are local state. */
export const ARTISAN_SERVICES: ArtisanService[] = [
  { id: 'plumbing', name: 'Plumbing', subtitle: 'Installation & Repair', priceNaira: 15000, imageKey: 'plumbing', enabled: true },
  { id: 'electrical', name: 'Electrical Work', subtitle: 'Wiring & Installation', priceNaira: 12000, imageKey: 'electrical', enabled: true },
  { id: 'ac', name: 'AC Installation', subtitle: 'Installation & Repair', priceNaira: 18000, imageKey: 'ac', enabled: true },
  { id: 'cleaning', name: 'House Cleaning', subtitle: 'General Cleaning', priceNaira: 10000, imageKey: 'cleaning', enabled: false },
  { id: 'appliance', name: 'Appliance Repair', subtitle: 'Washing Machine, Fridge', priceNaira: 14000, imageKey: 'appliance', enabled: true },
];

export type KycStep = {
  id: string;
  icon: IconName;
  title: string;
  status: 'completed' | 'pending';
};

/** KYC checklist (02-kyc-verification) — all complete in the design. */
export const KYC_STEPS: KycStep[] = [
  { id: 'personal', icon: 'person-outline', title: 'Personal Information', status: 'completed' },
  { id: 'id', icon: 'card-outline', title: 'ID Verification', status: 'completed' },
  { id: 'business', icon: 'briefcase-outline', title: 'Business Information', status: 'completed' },
  { id: 'bank', icon: 'cash-outline', title: 'Bank Account', status: 'completed' },
];

export type ProgressStep = {
  id: string;
  title: string;
  detail: string;
  state: 'done' | 'current' | 'upcoming';
  time?: string;
};

/** Job-in-progress timeline (08-job-progress). */
export const JOB_PROGRESS_STEPS: ProgressStep[] = [
  { id: 'arrived', title: 'Arrived at location', detail: 'Reached the customer location', state: 'done', time: '9:45 AM' },
  { id: 'diagnosing', title: 'Diagnosing issue', detail: 'Inspecting the reported fault', state: 'current', time: 'In Progress' },
  { id: 'work', title: 'Work in progress', detail: 'Carrying out the repair', state: 'upcoming', time: 'Pending' },
  { id: 'completed', title: 'Job completed', detail: 'Wrap up and confirm with customer', state: 'upcoming', time: 'Pending' },
];

/** Earnings overview (10-earnings-overview). */
export const EARNINGS = {
  totalNaira: 258500,
  changePct: 12.5,
  completedJobs: 24,
  totalHours: 120,
  avgPerJobNaira: 15000,
  availableNaira: 86500,
};

export type Payout = {
  id: string;
  date: string;
  amountNaira: number;
  status: 'Paid' | 'Pending';
};

export const PAYOUTS: Payout[] = [
  { id: '1', date: 'May 15, 2026', amountNaira: 65000, status: 'Paid' },
  { id: '2', date: 'May 8, 2026', amountNaira: 52000, status: 'Paid' },
  { id: '3', date: 'May 1, 2026', amountNaira: 48000, status: 'Paid' },
];

export type WithdrawalMethod = {
  id: string;
  name: string;
  tail: string;
  icon: IconName;
  tint: string;
};

export const WITHDRAWAL_METHODS: WithdrawalMethod[] = [
  { id: 'bank', name: 'Bank Transfer', tail: '4598', icon: 'business-outline', tint: '#3B82F6' },
  { id: 'opay', name: 'Opay Wallet', tail: '1234', icon: 'wallet-outline', tint: '#22C55E' },
  { id: 'palmpay', name: 'PalmPay Wallet', tail: '5678', icon: 'card-outline', tint: '#8B5CF6' },
];

export const QUICK_AMOUNTS = [10000, 20000, 50000] as const;

/** Naira formatter shared across the artisan screens. */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}
