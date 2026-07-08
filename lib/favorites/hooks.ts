import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addFavorite, getFavorites, removeFavorite } from '@/lib/api/favorites';

/** The signed-in customer's saved artisans. */
export function useFavorites(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

/** Whether a given artisan is currently saved (derived from the list). */
export function useIsFavorite(artisanId: string | undefined, enabled: boolean) {
  const { data } = useFavorites({ enabled });
  return !!artisanId && !!data?.some((a) => a.id === artisanId);
}

/** Toggle an artisan's saved state; refreshes the favourites list. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ artisanId, favorited }: { artisanId: string; favorited: boolean }) =>
      favorited ? removeFavorite(artisanId) : addFavorite(artisanId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });
}
