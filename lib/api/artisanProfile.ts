import { apiClient } from '@/lib/api/client';
import type {
  KycStatus,
  MyArtisanProfile,
  SaveArtisanProfileRequest,
  SubmitKycRequest,
} from '@/lib/artisan/profileTypes';

/**
 * Artisan self-onboarding + KYC. All require a bearer token for an Artisan-role
 * account. `getMyArtisanProfile` 404s until the artisan has onboarded — callers
 * treat that as "not onboarded yet".
 */

export async function getMyArtisanProfile(): Promise<MyArtisanProfile> {
  const { data } = await apiClient.get<MyArtisanProfile>('/api/v1/artisan/profile');
  return data;
}

export async function saveArtisanProfile(
  body: SaveArtisanProfileRequest,
): Promise<MyArtisanProfile> {
  const { data } = await apiClient.post<MyArtisanProfile>(
    '/api/v1/artisan/profile',
    body,
  );
  return data;
}

export async function getKycStatus(): Promise<KycStatus> {
  const { data } = await apiClient.get<KycStatus>('/api/v1/artisan/kyc');
  return data;
}

export async function submitKyc(body: SubmitKycRequest): Promise<KycStatus> {
  // Carries two (compressed) images — allow a generous timeout for slow uploads
  // rather than the client's default 15s.
  const { data } = await apiClient.post<KycStatus>('/api/v1/artisan/kyc', body, {
    timeout: 120_000,
  });
  return data;
}
