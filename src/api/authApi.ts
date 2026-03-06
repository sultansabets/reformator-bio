/**
 * Auth API endpoints.
 * Backend returns only accessToken and refreshToken — no user object.
 */

import { apiFetch, setAccessToken, setRefreshToken } from "./apiClient";

export interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * POST /auth/login
 * Stores accessToken and refreshToken in localStorage on success.
 */
export async function login(
  loginId: string,
  password: string
): Promise<LoginResponse> {
  const isEmail = loginId.includes("@");
  const body: LoginRequest = {
    password,
    ...(isEmail ? { email: loginId } : { phone: loginId }),
  };

  const res = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (res.accessToken) {
    setAccessToken(res.accessToken);
  }
  if (res.refreshToken) {
    setRefreshToken(res.refreshToken);
  }

  return res;
}
