import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  advanceArtisanJob,
  claimOpenJob,
  getArtisanJob,
  getArtisanJobs,
  getOpenJobs,
  submitJobCompletion,
  type ArtisanAction,
} from '@/lib/api/artisanJobs';
import type { SubmitCompletionRequest } from '@/lib/booking/types';

/**
 * TanStack Query hooks for the artisan's jobs. Jobs change as the artisan drives
 * them through the state machine, so they get a short stale time and every
 * transition invalidates the cached list + detail so the UI re-fetches the new
 * status.
 */

export function useArtisanJobs(status?: string) {
  return useQuery({
    queryKey: ['artisan-jobs', { status: status ?? null }],
    queryFn: () => getArtisanJobs(status),
    staleTime: 30_000,
  });
}

export function useArtisanJob(id: string | undefined) {
  return useQuery({
    queryKey: ['artisan-job', id],
    queryFn: () => getArtisanJob(id as string),
    enabled: !!id,
  });
}

/** Open (unassigned) requests the artisan can claim — polled a little more eagerly
 *  since jobs get taken by others. */
export function useOpenJobs() {
  return useQuery({
    queryKey: ['artisan-open-jobs'],
    queryFn: getOpenJobs,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

/** Claim an open request. Refreshes the open pool + the artisan's assigned jobs. */
export function useClaimOpenJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => claimOpenJob(id),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['artisan-open-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['artisan-jobs'] });
      queryClient.setQueryData(['artisan-job', job.id], job);
    },
  });
}

/** Mutation for the five transition verbs (accept / reject / on-my-way / arrive / start). */
export function useAdvanceArtisanJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: ArtisanAction }) =>
      advanceArtisanJob(id, action),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['artisan-jobs'] });
      queryClient.setQueryData(['artisan-job', job.id], job);
    },
  });
}

/** Submit proof of completed work (InProgress → AwaitingConfirmation). */
export function useSubmitJobCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SubmitCompletionRequest }) =>
      submitJobCompletion(id, body),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['artisan-jobs'] });
      queryClient.setQueryData(['artisan-job', job.id], job);
    },
  });
}
