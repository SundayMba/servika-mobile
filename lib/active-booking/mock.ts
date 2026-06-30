/**
 * Placeholder data for the Batch-3 active-booking screens (live tracking, chat,
 * arrived, in-progress, completion, review, report-issue).
 *
 * These screens are high-fidelity UI built ahead of their backends — live
 * tracking needs the SignalR slice, chat needs the messaging slice, status
 * transitions need the artisan app, reviews/disputes need their own slices. Until
 * then they render this mock so the flow is fully walkable. Screens override the
 * artisan/service name from navigation params when a real booking is in hand.
 */

export const MOCK_ARTISAN = {
  name: 'Emeka Okafor',
  specialty: 'Electrical Specialist',
  imageKey: 'emeka-okafor',
  rating: 4.8,
  jobsCount: '120+',
  etaMinutes: 12,
  distanceKm: 2.1,
};

export const TRACK_STEPS = [
  'Request Sent',
  'Accepted',
  'On My Way',
  'Arrived',
  'Job Started',
] as const;

export type ChatMessage = {
  id: string;
  from: 'me' | 'them';
  text: string;
  time: string;
};

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: '1', from: 'them', text: "Hi! I'm on my way and should be with you in about 12 minutes.", time: '9:28 AM' },
  { id: '2', from: 'me', text: 'Thanks for the update. See you soon.', time: '9:28 AM' },
  { id: '3', from: 'them', text: "You're welcome! I'll give you a quick call when I'm 2 minutes away.", time: '9:29 AM' },
  { id: '4', from: 'me', text: 'Sounds good. Please let me know if you need any gate access info.', time: '9:30 AM' },
  { id: '5', from: 'them', text: 'Will do, thanks! See you shortly.', time: '9:30 AM' },
];

export type ChecklistItem = {
  id: string;
  title: string;
  detail: string;
  state: 'done' | 'current' | 'upcoming';
  time?: string;
};

export const JOB_CHECKLIST: ChecklistItem[] = [
  { id: '1', title: 'Inspect wiring', detail: 'Checked all wiring and connections', state: 'done', time: '10:46 AM' },
  { id: '2', title: 'Install ceiling lights', detail: 'Installed 4 LED ceiling lights', state: 'done', time: '11:30 AM' },
  { id: '3', title: 'Test switches', detail: 'Testing all switches and sockets', state: 'current' },
  { id: '4', title: 'Clean up', detail: 'Clean and organize the work area', state: 'upcoming' },
];

export const ISSUE_TYPES = [
  { id: 'quality', icon: 'construct-outline', title: 'Poor quality work', detail: 'The work done was below expectations or incomplete.' },
  { id: 'no-show', icon: 'time-outline', title: 'Artisan did not arrive', detail: 'The artisan was a no-show or cancelled at the last minute.' },
  { id: 'payment', icon: 'card-outline', title: 'Payment issue', detail: 'I was overcharged, double-charged, or charged unexpectedly.' },
  { id: 'unsafe', icon: 'warning-outline', title: 'Unsafe behaviour', detail: 'I felt unsafe or uncomfortable with the artisan’s behaviour.' },
  { id: 'other', icon: 'ellipsis-horizontal-circle-outline', title: 'Other', detail: 'Something else happened that doesn’t fit the above.' },
] as const;
