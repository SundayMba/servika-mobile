/**
 * Auth shapes mirroring the backend Contracts (Servika.Contracts.Auth).
 * ASP.NET Core serialises with camelCase, so these match the JSON on the wire.
 */

export type Role = 'Customer' | 'Artisan' | 'Admin' | 'SuperAdmin';

/** Safe public user profile — never carries the password hash (see UserDto). */
export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: Role;
}

/** Response from POST /login and from a successful verify-otp (AuthResponse). */
export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  user: User;
  verificationRequired: boolean;
}

/**
 * Response from POST /register. Registration no longer logs the user in — it
 * emails a verification code; the session is issued at verify-otp.
 */
export interface RegisterResponse {
  email: string;
  verificationRequired: boolean;
}

/**
 * Response from POST /login. A verified account gets a `session`; an unverified
 * one gets `verificationRequired: true` (+ a freshly emailed code) and no session.
 */
export interface LoginResponse {
  verificationRequired: boolean;
  email: string;
  session?: AuthResponse;
}

/** The OTP purposes the backend accepts (wire values). */
export type OtpType = 'account_verification' | 'password_reset';

/** Response from POST /verify-otp. Tokens + user present only when it logs you in. */
export interface VerifyOtpResponse {
  verified: boolean;
  accessToken?: string;
  accessTokenExpiresAtUtc?: string;
  refreshToken?: string;
  user?: User;
}

/** Body for POST /register (RegisterRequest). */
export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: Role;
}

/** Body for POST /login (LoginRequest). */
export interface LoginRequest {
  emailOrPhone: string;
  password: string;
  deviceId?: string;
}
