import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  advanceArtisanJob,
  getArtisanJob,
  getArtisanJobs,
  type ArtisanAction,
} from '@/lib/api/artisanJobs';

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
