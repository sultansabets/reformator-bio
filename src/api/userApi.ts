/**
 * User profile API.
 */

import { apiFetch } from "./apiClient";

export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
}

/**
 * PATCH /user/profile
 * Updates the authenticated user's profile. Persists to backend.
 */
export async function updateUserProfile(
  data: UpdateUserProfilePayload
): Promise<unknown> {
  return apiFetch("/user/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
