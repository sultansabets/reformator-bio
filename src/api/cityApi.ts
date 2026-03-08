/**
 * Cities API.
 */

import { apiFetch } from "./apiClient";

export interface City {
  id: string;
  name: string;
}

export async function getCities(): Promise<City[]> {
  const res = await apiFetch<City[] | { data: City[] }>("/cities");
  return Array.isArray(res) ? res : res.data ?? [];
}
