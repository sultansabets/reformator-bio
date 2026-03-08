/**
 * Profile API.
 */

import { apiFetch } from "./apiClient";

export interface UpdateProfilePayload {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  weight?: number;
  cityId?: string;
}

export async function updateProfile(data: UpdateProfilePayload): Promise<unknown> {
  return apiFetch("/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
