/**
 * Auth API endpoints.
 */

import { apiFetch, setAccessToken } from "./apiClient";

export interface LoginRequest {
  phone?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    phone?: string;
    email?: string;
    nickname?: string;
    firstName?: string;
    lastName?: string;
    weight?: number;
    height?: number;
    dob?: string;
    activityLevel?: string;
  };
}

/**
 * POST /auth/login
 * Saves accessToken to localStorage on success.
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

  return res;
}
