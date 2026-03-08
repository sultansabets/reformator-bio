/**
 * Live Health Simulator — circadian rhythm engine for realistic 24h biometric streams.
 */

import type { QueryClient } from "@tanstack/react-query";
import { getOrRegisterSimulatorDevice } from "@/api/deviceApi";
import { syncDevice } from "@/api/deviceApi";

export type CircadianPhase =
  | "SLEEP"
  | "WAKE"
  | "WORK"
  | "LIGHT_ACTIVITY"
  | "WORKOUT"
  | "RECOVERY"
  | "WIND_DOWN";

const PHASE_RANGES: Record<
  CircadianPhase,
  { heartRate: [number, number]; hrv: [number, number]; steps: [number, number] }
> = {
  SLEEP: { heartRate: [50, 60], hrv: [70, 90], steps: [0, 0] },
  WAKE: { heartRate: [60, 70], hrv: [60, 80], steps: [0, 10] },
  WORK: { heartRate: [70, 85], hrv: [40, 60], steps: [5, 15] },
  LIGHT_ACTIVITY: { heartRate: [75, 90], hrv: [35, 55], steps: [10, 30] },
  WORKOUT: { heartRate: [110, 150], hrv: [10, 20], steps: [40, 80] },
  RECOVERY: { heartRate: [65, 75], hrv: [60, 80], steps: [0, 5] },
  WIND_DOWN: { heartRate: [60, 65], hrv: [65, 85], steps: [0, 5] },
};

export function getCircadianState(hour: number): CircadianPhase {
  if (hour >= 0 && hour < 6) return "SLEEP";
  if (hour >= 6 && hour < 8) return "WAKE";
  if (hour >= 8 && hour < 12) return "WORK";
  if (hour >= 12 && hour < 13) return "LIGHT_ACTIVITY";
  if (hour >= 13 && hour < 17) return "WORK";
  if (hour >= 17 && hour < 19) return "WORKOUT";
  if (hour >= 19 && hour < 22) return "RECOVERY";
  return "WIND_DOWN"; // 22–24
}

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let fastSimulationMode = false;
let simulatedHours = 0;
let latestMetrics: {
  heartRate: number;
  steps: number;
  hrv: number | null;
} | null = null;
let lastHrv: number | null = null;

function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value: number, minVal: number, maxVal: number): number {
  return Math.max(minVal, Math.min(maxVal, value));
}

export function getIsSimulationRunning(): boolean {
  return simulationInterval != null;
}

export function enableFastSimulation(): void {
  fastSimulationMode = true;
}

export function disableFastSimulation(): void {
  fastSimulationMode = false;
}

export function getCurrentPhysiologicalState(): CircadianPhase {
  return getCircadianState(new Date().getHours());
}

export function getLatestMetrics(): {
  heartRate: number;
  steps: number;
  hrv: number | null;
} | null {
  return latestMetrics;
}

export async function startHealthSimulation(
  queryClient: QueryClient
): Promise<void> {
  if (simulationInterval) return;

  const deviceId = await getOrRegisterSimulatorDevice();
  let tickCount = 0;
  simulatedHours = 0;
  latestMetrics = null;

  const tick = async () => {
    tickCount++;
    const hour = fastSimulationMode
      ? simulatedHours % 24
      : new Date().getHours();
    const phase = getCircadianState(hour);
    const ranges = PHASE_RANGES[phase];

    const [hrMin, hrMax] = ranges.heartRate;
    const [stepsMin, stepsMax] = ranges.steps;
    const [hrvMin, hrvMax] = ranges.hrv;

    let valueBpm = random(hrMin, hrMax);
    const count = random(stepsMin, stepsMax);
    let valueMs: number | null = null;

    valueBpm = clamp(valueBpm + random(-2, 2), Math.max(40, hrMin - 5), hrMax + 5);

    if (tickCount % 5 === 0) {
      valueMs = random(hrvMin, hrvMax);
      valueMs = clamp(valueMs + random(-3, 3), Math.max(5, hrvMin - 5), hrvMax + 5);
      lastHrv = valueMs;
    }

    const recordedAt = fastSimulationMode
      ? new Date(Date.now() + simulatedHours * 3600_000).toISOString()
      : new Date().toISOString();
    if (fastSimulationMode) simulatedHours++;
    latestMetrics = {
      heartRate: valueBpm,
      steps: count,
      hrv: valueMs ?? lastHrv,
    };

    const payload = {
      deviceId,
      heartRates: [{ valueBpm, recordedAt }],
      steps: [{ count, recordedAt }],
      ...(valueMs != null && {
        hrv: [{ valueMs, recordedAt }],
      }),
    };

    try {
      await syncDevice(payload);
      await queryClient.invalidateQueries({ queryKey: ["metrics"] });
    } catch {
      // ignore sync errors
    }
  };

  await tick();
  const intervalMs = fastSimulationMode ? 3_000 : 60_000;
  simulationInterval = setInterval(tick, intervalMs);
}

export function stopHealthSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}
