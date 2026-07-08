import axios from 'axios';
import { apiClient } from '@/lib/api/client';
import type {
  AuthResponse,
  LoginRequest,
  LoginResponse,
  OtpType,
  RegisterRequest,
  RegisterResponse,
  User,
  VerifyOtpResponse,
} from '@/lib/auth/types';

/**
 * Auth endpoints (PRD §9.1). Thin wrappers over the shared axios client that
 * return typed response bodies. Base path is /api/v1/auth.
 */

const BASE = '/api/v1/auth';

/** Creates an unverified account and emails a verification code (no session yet). */
export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(`${BASE}/register`, body);
  return data;
}

/**
 * "Become a Pro" — upgrades the signed-in account to an artisan and returns a
 * fresh session (tokens carry the new role). The caller must `signIn` the result
 * so subsequent artisan endpoints authorize.
 */
export async function becomeArtisan(): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(`${BASE}/become-artisan`);
  return data;
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(`${BASE}/login`, body);
  return data;
}

/** Revokes the refresh token server-side. Idempotent — safe to call anytime. */
export async function updateProfile(body: {
  fullName: string;
  phoneNumber: string;
}): Promise<User> {
  const { data } = await apiClient.patch<User>(`${BASE}/me`, body);
  return data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post(`${BASE}/logout`, { refreshToken });
}

/** Verifies a code. For account verification the response carries the session. */
export async function verifyOtp(body: {
  otpCode: string;
  otpType: OtpType;
  emailOrPhone: string;
}): Promise<VerifyOtpResponse> {
  const { data } = await apiClient.post<VerifyOtpResponse>(`${BASE}/verify-otp`, body);
  return data;
}

/** Re-sends a verification/reset code. Returns how long the new code is valid. */
export async function resendOtp(body: {
  emailOrPhone: string;
  otpType: OtpType;
}): Promise<{ sent: boolean; expiresInSeconds: number }> {
  const { data } = await apiClient.post(`${BASE}/resend-otp`, body);
  return data;
}

/**
 * Starts a password reset. Always resolves (the server never reveals whether an
 * account exists), so callers should show the same "check your messages" state
 * regardless. Dev delivery logs the reset code (LoggingOtpSender).
 */
export async function forgotPassword(emailOrPhone: string): Promise<void> {
  await apiClient.post(`${BASE}/forgot-password`, { emailOrPhone });
}

/** Completes a password reset with the 6-digit code from the forgot-password step. */
export async function resetPassword(body: {
  emailOrPhone: string;
  tokenOrOtp: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  await apiClient.patch(`${BASE}/reset-password`, body);
}

/**
 * Turns an axios error into a user-facing message. The backend returns RFC 7807
 * ProblemDetails whose `title` carries the human-readable reason (e.g. "An
 * account with this email already exists.", "Invalid email/phone or password.").
 */
export function authErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    const data = error.response.data as { title?: string; detail?: string } | undefined;
    return data?.title ?? data?.detail ?? fallback;
  }
  return fallback;
}
