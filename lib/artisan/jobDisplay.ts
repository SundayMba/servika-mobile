import type { Href } from 'expo-router';

import { statusStyle } from '@/lib/booking/display';
import type { BookingStatus, BookingSummary } from '@/lib/booking/types';
import type { JobRequest } from '@/lib/artisan/mock';

/**
 * Presentation helpers for the artisan job screens — grouping a flat job list
 * into the New/Active/History tabs, mapping a booking row to the card view-model
 * the Pro components expect, and deciding which screen a job opens given its
 * state. Re-uses the shared booking `statusStyle` so a status looks identical on
 * both sides of the marketplace.
 */

export { statusStyle };

const ACTIVE: BookingStatus[] = ['Accepted', 'OnMyWay', 'Arrived', 'InProgress'];
const HISTORY: BookingStatus[] = ['Completed', 'Cancelled', 'Rejected', 'Expired', 'Disputed'];

export type JobGroups = {
  new: BookingSummary[];
  active: BookingSummary[];
  history: BookingSummary[];
};

/** Split the artisan's jobs into the three tabs (newest first within each). */
export function groupArtisanJobs(jobs: BookingSummary[] | undefined): JobGroups {
  const groups: JobGroups = { new: [], active: [], history: [] };
  for (const j of jobs ?? []) {
    if (j.status === 'Pending') groups.new.push(j);
    else if (ACTIVE.includes(j.status)) groups.active.push(j);
    else if (HISTORY.includes(j.status)) groups.history.push(j);
  }
  return groups;
}

/** Map a booking row to the `JobRequest` view-model the Pro cards render. The
 *  summary carries no category slug or distance, so the thumbnail falls back to
 *  an icon and distance is omitted. */
export function bookingToCard(b: BookingSummary): JobRequest {
  return {
    id: b.id,
    service: b.serviceName,
    area: b.addressText,
    amountNaira: b.amountNaira ?? 0,
    when: b.preferredTimeSlot || '',
    isNew: b.status === 'Pending',
  };
}

/** The Pro screen a job should open, given its current state. Pending jobs go to
 *  the detail/accept screen; accepted/en-route jobs resume at the trip screen;
 *  arrived/in-progress at the job-progress screen; terminal jobs are read-only. */
export function nextRouteForJob(id: string, status: BookingStatus): Href {
  switch (status) {
    case 'Accepted':
    case 'OnMyWay':
      return `/pro/start-trip?id=${id}` as Href;
    case 'Arrived':
    case 'InProgress':
      return `/pro/job-progress?id=${id}` as Href;
    default:
      return `/pro/job/${id}` as Href;
  }
}
