/**
 * Energy Engine — вклад систем в энергию и рекомендации.
 * Чистые функции. Без UI.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 50));

export type EnergySystemKey = "sleep" | "adaptation" | "load";

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

/** Вычисляет вклад и рекомендацию на основе формулы Energy из healthEngine. */
export function calculateEnergyDetail(data: {
  sleep: number;
  adaptation: number;
  load: number;
}): EnergyEngineResult {
  const sleep = clamp(data.sleep);
  const adaptation = clamp(data.adaptation);
  const load = clamp(data.load);

  const recoveryCapacity = sleep * 0.5 + adaptation * 0.5;
  let energy = recoveryCapacity - load * 0.6;
  if (load > recoveryCapacity) {
    const overload = load - recoveryCapacity;
    energy -= overload * 0.5;
  }
  const energyScore = Math.round(clamp(energy));

  const neutral = 50;
  const sleepContrib = Math.round((sleep - neutral) * 0.5);
  const adaptationContrib = Math.round((adaptation - neutral) * 0.5);
  const loadContrib = load > 0 ? -Math.round(load * 0.6) : 0;

  const contributions: EnergyContribution[] = [
    { key: "sleep", delta: sleepContrib, labelKey: "energyDetail.sleep" },
    { key: "adaptation", delta: adaptationContrib, labelKey: "energyDetail.adaptation" },
    { key: "load", delta: loadContrib, labelKey: "energyDetail.load" },
  ];

  const scores = [
    { key: "sleep" as const, value: sleep },
    { key: "adaptation" as const, value: adaptation },
    { key: "load" as const, value: 100 - load },
  ];
  const weakest = scores.reduce((min, s) => (s.value < min.value ? s : min));

  let recommendationKey: string;
  if (weakest.key === "load") {
    recommendationKey = "energyDetail.recLoad";
  } else if (weakest.key === "sleep") {
    recommendationKey = "energyDetail.recSleep";
  } else {
    recommendationKey = "energyDetail.recAdaptation";
  }

  return {
    energyScore,
    contributions,
    weakestSystem: weakest.key,
    recommendationKey,
  };
}
