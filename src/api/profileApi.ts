/**
 * Profile API.
 */

import { apiFetch } from "./apiClient";

export interface Profile {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  birthDate?: string;
  height?: number;
  weight?: number;
  sex?: "male" | "female";
  city?: { id: string; name?: string };
}

export async function getProfile(): Promise<Profile> {
  return apiFetch<Profile>("/profile");
}

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
