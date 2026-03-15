/**
 * Auth API — pure functions, no state, no side-effects beyond network.
 * All business logic lives in the backend.
 */

import { apiClient } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountStatus = 'pending_onboarding' | 'pending_approval' | 'approved' | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  accountStatus: AccountStatus;
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
  isNewUser: boolean;
  mustChangePassword: boolean;
}

interface ApiWrapper<T> {
  data: T;
}

// ─── API calls ────────────────────────────────────────────────────────────────

const AUTH = "/api/v1/auth";

export async function loginUser(
  email: string,
  password: string,
  rememberMe = false
): Promise<LoginResponse> {
  const res = await apiClient<ApiWrapper<LoginResponse>>(`${AUTH}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
  return res.data;
}

export async function logoutUser(accessToken: string): Promise<void> {
  await apiClient(`${AUTH}/logout`, {
    method: "POST",
    accessToken,
  });
}

export async function refreshToken(): Promise<AuthTokens> {
  const res = await apiClient<ApiWrapper<AuthTokens>>(`${AUTH}/refresh`, {
    method: "POST",
  });
  return res.data;
}

export async function getMe(accessToken: string): Promise<User> {
  const res = await apiClient<ApiWrapper<User>>(`${AUTH}/me`, {
    accessToken,
  });
  return res.data;

}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient(`${AUTH}/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resendVerification(accessToken: string): Promise<void> {
  await apiClient(`${AUTH}/resend-verification`, {
    method: "POST",
    accessToken,
  });
}

/** Public resend — no auth required. Uses email only. Always returns success. */
export async function resendVerificationByEmail(email: string): Promise<void> {
  await apiClient(`${AUTH}/resend-verification-by-email`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await apiClient<ApiWrapper<LoginResponse>>(`${AUTH}/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  return res.data;
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient(`${AUTH}/verify-email?token=${encodeURIComponent(token)}`);
}

export async function resetPassword(
  token: string,
  password: string
): Promise<void> {
  await apiClient(`${AUTH}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}
