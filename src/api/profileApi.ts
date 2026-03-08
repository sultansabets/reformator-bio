/**
 * Profile API.
 */

import { apiFetch } from "./apiClient";

export interface UpdateProfilePayload {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  sex?: "male" | "female";
  cityId?: string;
}

export async function updateProfile(data: UpdateProfilePayload): Promise<unknown> {
  return apiFetch("/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
