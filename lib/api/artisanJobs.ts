import { apiClient } from '@/lib/api/client';
import type {
  BookingDetail,
  BookingSummary,
  SubmitCompletionRequest,
} from '@/lib/booking/types';

/**
 * Artisan-side job endpoints (Slice 5a). Thin wrappers over the shared axios
 * client. All are auth-gated (bearer attached by the client) and require the
 * Artisan role; the server scopes every call to the jobs assigned to the
 * signed-in artisan. Base path /api/v1/artisan/jobs.
 *
 * Jobs are the same Booking records the customer sees, so the response bodies
 * reuse the booking DTO types.
 */

const BASE = '/api/v1/artisan/jobs';

/** The forward state-machine moves the assigned artisan can make. */
export type ArtisanAction = 'accept' | 'reject' | 'on-my-way' | 'arrive' | 'start';

/** Jobs assigned to the current artisan, newest first; optional status filter. */
export async function getArtisanJobs(status?: string): Promise<BookingSummary[]> {
  const { data } = await apiClient.get<BookingSummary[]>(BASE, {
    params: status ? { status } : undefined,
  });
  return data;
}

/** A single job assigned to the current artisan. */
export async function getArtisanJob(id: string): Promise<BookingDetail> {
  const { data } = await apiClient.get<BookingDetail>(`${BASE}/${id}`);
  return data;
}

/** Open (unassigned) requests in the artisan's categories that they can claim. */
export async function getOpenJobs(): Promise<BookingSummary[]> {
  const { data } = await apiClient.get<BookingSummary[]>(`${BASE}/open`);
  return data;
}

/** Claim an open request (first-come-first-served). Returns the now-assigned job. */
export async function claimOpenJob(id: string): Promise<BookingDetail> {
  const { data } = await apiClient.post<BookingDetail>(`${BASE}/${id}/claim`);
  return data;
}

/** Advance a job through the state machine. Returns the updated job. */
export async function advanceArtisanJob(
  id: string,
  action: ArtisanAction,
): Promise<BookingDetail> {
  const { data } = await apiClient.post<BookingDetail>(`${BASE}/${id}/${action}`);
  return data;
}

/** Submit proof of completed work (InProgress → AwaitingConfirmation). */
export async function submitJobCompletion(
  id: string,
  body: SubmitCompletionRequest,
): Promise<BookingDetail> {
  const { data } = await apiClient.post<BookingDetail>(
    `${BASE}/${id}/submit-completion`,
    body,
    { timeout: 120_000 },
  );
  return data;
}
