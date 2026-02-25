/**
 * Load Engine — новая модель нагрузки.
 * Чистые функции. Без UI.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));

export type LoadStatus = "balanced" | "overloaded" | "low_activity";

export interface LoadEngineResult {
  physicalScore: number;
  neuroScore: number;
  totalLoad: number;
  status: LoadStatus;
}

export interface LoadEngineInput {
  strengthMinutes: number;
  cardioMinutes: number;
  steps: number;
  intensity: number;
  stress: number; // 0–10
  totalSleepMinutes: number;
  awakenings: number;
}

export function calculateLoadDetail(input: LoadEngineInput): LoadEngineResult {
  const strengthMinutes = Math.max(0, input.strengthMinutes);
  const cardioMinutes = Math.max(0, input.cardioMinutes);
  const steps = Math.max(0, input.steps);

  const stress = clamp(input.stress * 10) / 10; // нормируем к 0–10
  const totalSleepMinutes = Math.max(0, input.totalSleepMinutes);
  const awakenings = Math.max(0, input.awakenings);

  // Физическая нагрузка
  const strengthLoad = strengthMinutes * 1.2;
  const cardioLoad = cardioMinutes * 1.0;
  const stepsLoad = (steps / 1000) * 2;
  const physicalLoad = strengthLoad + cardioLoad + stepsLoad;
  const physicalScore = clamp(physicalLoad / 20);

  // Нагрузка на нервную систему
  const stressLoad = stress * 8;
  const sleepPenalty = Math.max(0, 450 - totalSleepMinutes) / 10;
  const awakeningPenalty = awakenings * 3;
  const neuroLoad = stressLoad + sleepPenalty + awakeningPenalty;
  const neuroScore = clamp(neuroLoad);

  // Общая нагрузка
  const totalLoad = clamp(physicalScore * 0.6 + neuroScore * 0.4);

  let status: LoadStatus = "balanced";
  if (totalLoad > 70 || neuroScore > 80 || totalSleepMinutes < 360) {
    status = "overloaded";
  } else if (totalLoad < 40 && physicalScore < 35) {
    status = "low_activity";
  } else if (totalLoad >= 40 && totalLoad <= 70 && neuroScore < 70) {
    status = "balanced";
  }

  return {
    physicalScore: Math.round(physicalScore),
    neuroScore: Math.round(neuroScore),
    totalLoad: Math.round(totalLoad),
    status,
  };
}
