import axios from 'axios';
import { config } from '@/lib/config';
import { tokenStorage } from '@/lib/auth/tokenStorage';

/**
 * Shared axios instance for the Servika API.
 *
 * - baseURL points at the raw host; callers pass full paths like
 *   `/api/v1/auth/login` (or use the `apiUrl()` helper from config).
 * - A request interceptor attaches the bearer token when one exists.
 *   Token refresh-on-401 is added in the Auth slice; for now an absent
 *   token simply means an unauthenticated request.
 */
export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (request) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});
