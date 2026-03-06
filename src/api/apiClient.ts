/**
 * Base API client using fetch.
 * - Uses VITE_API_URL from environment
 * - Attaches Authorization Bearer token from localStorage
 * - Parses JSON responses
 * - Throws on non-2xx responses
 */

export const BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "https://reformator-backend-production.up.railway.app";

const ACCESS_TOKEN_KEY = "reformator_access_token";
const REFRESH_TOKEN_KEY = "reformator_refresh_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export interface ApiError {
  message: string;
  status: number;
  body?: unknown;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    const error: ApiError = {
      message: (body as { message?: string })?.message || response.statusText || "Request failed",
      status: response.status,
      body,
    };
    throw error;
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw {
      message: "Invalid JSON response",
      status: response.status,
      body: text,
    } as ApiError;
  }
}
