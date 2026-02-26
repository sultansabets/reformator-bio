/**
 * Load Engine — аналитический модуль нагрузки.
 * BodyLoad (тело) + NeuroLoad (нервная система) = TotalLoad.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));

export type LoadStatus = "balanced" | "overloaded" | "low_activity";

export interface LoadEngineResult {
  totalLoad: number;
  bodyLoad: number;
  neuroLoad: number;
  strengthLoad: number;
  cardioLoad: number;
  stepsLoad: number;
  stressLoad: number;
  sleepDebtLoad: number;
  hrvLoad: number;
  status: LoadStatus;
}

export interface LoadEngineInput {
  /** Силовые тренировки: минуты или (рабочие подходы × вес × коэффициент) / масса тела */
  strengthMinutes?: number;
  strengthScore?: number; // 0–100 если есть детальные данные
  cardioMinutes?: number;
  cardioZone?: 1 | 2 | 3 | 4; // пульсовая зона
  steps: number;
  bodyWeightKg?: number;
  stress: number; // 0–100
  totalSleepMinutes: number;
  optimalSleepMinutes?: number; // личная норма, по умолчанию 450
  hrv: number;
  hrvNorm?: number; // личная норма HRV
}

const CARDIO_ZONE_FACTOR: Record<number, number> = {
  1: 0.5,
  2: 0.8,
  3: 1.0,
  4: 1.3,
};

/** StepsLoad: <4000→10%, 8000→50%, 12000+→100%, линейно между */
function stepsToLoad(steps: number): number {
  if (steps <= 0) return 0;
  if (steps < 4000) return 10 * (steps / 4000);
  if (steps < 8000) return 10 + 40 * ((steps - 4000) / 4000);
  if (steps < 12000) return 50 + 50 * ((steps - 8000) / 4000);
  return 100;
}

/** SleepDebtLoad: каждый час недосыпа = +15%, максимум 100% */
function sleepDebtToLoad(actual: number, optimal: number): number {
  const debt = Math.max(0, optimal - actual);
  return Math.min(100, (debt / 60) * 15);
}

/** HRVLoad: если ниже нормы — ((норма - факт) / норма) × 100 */
function hrvToLoad(hrv: number, norm: number): number {
  if (norm <= 0 || hrv >= norm) return 0;
  return clamp(((norm - hrv) / norm) * 100);
}

export function calculateLoadDetail(input: LoadEngineInput): LoadEngineResult {
  const steps = Math.max(0, input.steps);
  const stress = clamp(input.stress);
  const totalSleepMinutes = Math.max(0, input.totalSleepMinutes);
  const optimalSleep = input.optimalSleepMinutes ?? 450;
  const hrv = Math.max(0, input.hrv);
  const hrvNorm = input.hrvNorm ?? 50;

  // StrengthLoad — fallback: минуты × субъективная интенсивность
  let strengthLoad: number;
  if (input.strengthScore != null && input.strengthScore >= 0) {
    strengthLoad = clamp(input.strengthScore);
  } else {
    const minutes = (input.strengthMinutes ?? 0) * (input.strengthMinutes ? 1.5 : 0);
    strengthLoad = clamp(minutes * 2);
  }

  // CardioLoad: минуты × зона × коэффициент
  const cardioMinutes = input.cardioMinutes ?? 0;
  const zone = input.cardioZone ?? 2;
  const zoneFactor = CARDIO_ZONE_FACTOR[zone] ?? 1;
  const cardioLoad = clamp(cardioMinutes * zoneFactor * 0.5);

  const stepsLoad = clamp(stepsToLoad(steps));

  // BodyLoad = 0.5*Strength + 0.3*Cardio + 0.2*Steps
  const bodyLoad = clamp(
    0.5 * strengthLoad + 0.3 * cardioLoad + 0.2 * stepsLoad
  );

  const stressLoad = clamp(stress);
  const sleepDebtLoad = clamp(sleepDebtToLoad(totalSleepMinutes, optimalSleep));
  const hrvLoad = hrvToLoad(hrv, hrvNorm);

  // NeuroLoad = 0.5*Stress + 0.3*SleepDebt + 0.2*HRV
  const neuroLoad = clamp(
    0.5 * stressLoad + 0.3 * sleepDebtLoad + 0.2 * hrvLoad
  );

  // TotalLoad = 0.6*BodyLoad + 0.4*NeuroLoad
  const totalLoad = clamp(0.6 * bodyLoad + 0.4 * neuroLoad);

  let status: LoadStatus = "balanced";
  if (totalLoad < 40) status = "low_activity";
  else if (totalLoad > 70) status = "overloaded";

  return {
    totalLoad: Math.round(totalLoad),
    bodyLoad: Math.round(bodyLoad),
    neuroLoad: Math.round(neuroLoad),
    strengthLoad: Math.round(strengthLoad),
    cardioLoad: Math.round(cardioLoad),
    stepsLoad: Math.round(stepsLoad),
    stressLoad: Math.round(stressLoad),
    sleepDebtLoad: Math.round(sleepDebtLoad),
    hrvLoad: Math.round(hrvLoad),
    status,
  };
}
