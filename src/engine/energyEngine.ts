/**
 * Energy Engine — вклад систем в энергию и рекомендации.
 * Чистые функции. Без UI.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 50));

export type EnergySystemKey = "sleep" | "load";

export interface EnergyContribution {
  key: EnergySystemKey;
  delta: number; // +X или -X
  labelKey: string;
}

export interface EnergyEngineResult {
  energyScore: number;
  contributions: EnergyContribution[];
  weakestSystem: EnergySystemKey;
  recommendationKey: string;
}

/**
 * Вычисляет детали состояния.
 * Формула: (recoveryFactor * 0.6 + stressFactor * 0.4) * 100
 * - recoveryFactor = sleep / 100
 * - stressFactor = 1 - load / 100
 */
export function calculateEnergyDetail(data: { sleep: number; load: number }): EnergyEngineResult {
  const sleep = clamp(data.sleep);
  const load = clamp(data.load);

  const recoveryFactor = sleep / 100;
  const stressFactor = 1 - load / 100;
  const energyScore = Math.round((recoveryFactor * 0.6 + stressFactor * 0.4) * 100);

  const contributions: EnergyContribution[] = [
    { key: "sleep", delta: Math.round((sleep - 50) * 0.6), labelKey: "energyDetail.sleep" },
    { key: "load", delta: Math.round((50 - load) * 0.4), labelKey: "energyDetail.load" },
  ];

  const weakestSystem: EnergySystemKey = sleep < (100 - load) ? "sleep" : "load";
  const recommendationKey = weakestSystem === "load" ? "energyDetail.recLoad" : "energyDetail.recSleep";

  return {
    energyScore,
    contributions,
    weakestSystem,
    recommendationKey,
  };
}
