/**
 * Device sync API for health data.
 */

import { apiFetch } from "./apiClient";

/** Cached simulator device id — registration happens once per session */
let cachedSimulatorDeviceId: string | null = null;

export interface RegisterDevicePayload {
  deviceId: string;
  manufacturer: string;
  model: string;
  deviceType: string;
}

export interface RegisterDeviceResponse {
  id: string;
  deviceId?: string;
  [key: string]: unknown;
}

/**
 * POST /devices/register
 * Registers a simulator device. Returns the database device id.
 */
export async function registerSimulatorDevice(): Promise<string> {
  const res = await apiFetch<RegisterDeviceResponse>("/devices/register", {
    method: "POST",
    body: JSON.stringify({
      deviceId: "simulator-watch",
      manufacturer: "reformator",
      model: "simulator",
      deviceType: "watch",
    }),
  });
  const id = res?.id;
  if (!id || typeof id !== "string") {
    throw new Error("Invalid device registration response");
  }
  cachedSimulatorDeviceId = id;
  return id;
}

/**
 * Returns the cached simulator device id, or registers and caches it.
 */
export async function getOrRegisterSimulatorDevice(): Promise<string> {
  if (cachedSimulatorDeviceId) return cachedSimulatorDeviceId;
  return registerSimulatorDevice();
}

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
