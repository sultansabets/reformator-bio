/**
 * Device API endpoints.
 */

import { apiFetch } from "./apiClient";

export interface RegisterDeviceRequest {
  deviceId: string;
  type: "apple" | "reformator-band";
  name?: string;
}

export interface RegisterDeviceResponse {
  id?: string;
  deviceId: string;
  type: string;
  registeredAt?: string;
}

export interface DeviceSyncPayload {
  date?: string;
  sleepMinutes?: number;
  sleepQuality?: number;
  hrv?: number;
  heartRate?: number;
  steps?: number;
  raw?: Record<string, unknown>;
}

export interface DeviceSyncResponse {
  success: boolean;
  syncedAt?: string;
}

/**
 * POST /devices/register
 */
export async function registerDevice(
  data: RegisterDeviceRequest
): Promise<RegisterDeviceResponse> {
  return apiFetch<RegisterDeviceResponse>("/devices/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * POST /device/sync
 * Note: Backend may use /device/sync (singular) as per spec.
 */
export async function syncDevice(
  payload: DeviceSyncPayload
): Promise<DeviceSyncResponse> {
  return apiFetch<DeviceSyncResponse>("/device/sync", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
