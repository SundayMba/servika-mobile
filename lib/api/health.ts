import { useQuery } from '@tanstack/react-query';
import { config } from '@/lib/config';
import { apiClient } from '@/lib/api/client';

/**
 * Pings the backend /health endpoint. Used by the dev connectivity badge to
 * confirm the mobile app can reach the API. The endpoint returns the plain
 * text "Healthy" (ASP.NET Core health checks).
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get<string>('/health', {
        baseURL: config.apiBaseUrl,
        responseType: 'text',
      });
      return typeof data === 'string' ? data.trim() : String(data);
    },
    retry: 0,
    staleTime: 10_000,
  });
}
