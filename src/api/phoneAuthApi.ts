/**
 * Phone OTP authentication API.
 * Backend: POST /auth/request-code, POST /auth/verify-code
 */

import { apiFetch, setAccessToken, setRefreshToken } from "./apiClient";

export interface RequestCodeResponse {
  success: boolean;
}

export interface VerifyCodeResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * POST /auth/request-code
 * Sends OTP to the given phone number.
 */
export async function requestCode(phone: string): Promise<RequestCodeResponse> {
  return apiFetch<RequestCodeResponse>("/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

/**
 * POST /auth/verify-code
 * Verifies OTP and returns tokens. Saves them to localStorage.
 */
export async function verifyCode(phone: string, code: string): Promise<VerifyCodeResponse> {
  const res = await apiFetch<VerifyCodeResponse>("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
  });

  if (res.accessToken) {
    setAccessToken(res.accessToken);
  }
  if (res.refreshToken) {
    setRefreshToken(res.refreshToken);
  }

  return res;
}
