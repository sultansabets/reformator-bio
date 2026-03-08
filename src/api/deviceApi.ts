/**
 * Device sync API for health data.
 */

import { apiFetch } from "./apiClient";

export interface DeviceSyncHeartRate {
  valueBpm: number;
  recordedAt: string;
}

export interface DeviceSyncHrv {
  valueMs: number;
  recordedAt: string;
}

export interface DeviceSyncSteps {
  count: number;
  recordedAt: string;
}

export interface DeviceSyncPayload {
  deviceId: string;
  heartRates?: DeviceSyncHeartRate[];
  hrv?: DeviceSyncHrv[];
  steps?: DeviceSyncSteps[];
}

/**
 * POST /device/sync
 * Sends health data from a device (or simulator) to the backend.
 */
export async function syncDevice(payload: DeviceSyncPayload): Promise<unknown> {
  return apiFetch("/device/sync", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
