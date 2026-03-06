/**
 * Persists API-authenticated user for session restoration.
 * Used when login comes from backend (not localStorage users).
 */

const API_USER_KEY = "reformator_api_user";

export interface ApiUser {
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
}

export function getStoredApiUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(API_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function setStoredApiUser(user: ApiUser | null): void {
  if (!user) {
    localStorage.removeItem(API_USER_KEY);
    return;
  }
  localStorage.setItem(API_USER_KEY, JSON.stringify(user));
}
