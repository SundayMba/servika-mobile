import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getKycStatus,
  getMyArtisanProfile,
  saveArtisanProfile,
  submitKyc,
} from '@/lib/api/artisanProfile';

/**
 * Hooks for artisan onboarding + KYC. `useMyArtisanProfile` uses `retry: false`
 * so a 404 (not onboarded) resolves quickly to the onboarding route. Mutations
 * invalidate the profile, KYC status, and the public catalogue (so a freshly
 * verified artisan shows up).
 */

export function useMyArtisanProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['artisan-profile', 'me'],
    queryFn: getMyArtisanProfile,
    retry: false,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

export function useKycStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['artisan-kyc'],
    queryFn: getKycStatus,
    staleTime: 15_000,
    enabled: options?.enabled ?? true,
  });
}

function useOnboardingInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['artisan-profile'] });
    queryClient.invalidateQueries({ queryKey: ['artisan-kyc'] });
    queryClient.invalidateQueries({ queryKey: ['artisans'] });
  };
}

export function useSaveArtisanProfile() {
  const invalidate = useOnboardingInvalidation();
  return useMutation({ mutationFn: saveArtisanProfile, onSuccess: invalidate });
}

export function useSubmitKyc() {
  const invalidate = useOnboardingInvalidation();
  return useMutation({ mutationFn: submitKyc, onSuccess: invalidate });
}
