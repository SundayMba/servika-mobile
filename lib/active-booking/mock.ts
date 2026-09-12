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

export const TRACK_STEPS = [
  'Request Sent',
  'Accepted',
  'On My Way',
  'Arrived',
  'Job Started',
] as const;

export const ISSUE_TYPES = [
  { id: 'quality', icon: 'construct-outline', title: 'Poor quality work', detail: 'The work done was below expectations or incomplete.' },
  { id: 'no-show', icon: 'time-outline', title: 'Artisan did not arrive', detail: 'The artisan was a no-show or cancelled at the last minute.' },
  { id: 'payment', icon: 'card-outline', title: 'Payment issue', detail: 'I was overcharged, double-charged, or charged unexpectedly.' },
  { id: 'unsafe', icon: 'warning-outline', title: 'Unsafe behaviour', detail: 'I felt unsafe or uncomfortable with the artisan’s behaviour.' },
  { id: 'other', icon: 'ellipsis-horizontal-circle-outline', title: 'Other', detail: 'Something else happened that doesn’t fit the above.' },
] as const;
