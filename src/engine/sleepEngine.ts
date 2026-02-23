/**
 * Sleep Engine — расчёт сна из 5 физиологических блоков.
 * Чистые функции. Все значения clamp 0–100.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, v));

const DEFAULT_OPTIMAL_SLEEP_MINUTES = 480;
const DEFAULT_OPTIMAL_DEEP_PERCENT = 20;
const DEFAULT_OPTIMAL_REM_PERCENT = 25;
const SLEEP_DEBT_PENALTY_THRESHOLD_MINUTES = 120;
const DURATION_DEBT_PENALTY = 10;

export interface SleepEngineInput {
  actualSleepMinutes: number;
  personalOptimalSleepMinutes?: number;
  sleepDebtMinutes?: number;
  awakenings?: number;
  totalWakeMinutes?: number;
  currentNightHR?: number;
  baselineNightHR?: number;
  currentNightHRV?: number;
  baselineHRV?: number;
  deepPercent?: number;
  optimalDeepPercent?: number;
  remPercent?: number;
  optimalRemPercent?: number;
  sleepLatencyMinutes?: number;
}

export interface SleepBlock {
  key: "duration" | "continuity" | "hr" | "hrv" | "architecture";
  score: number;
  weight: number;
  labelKey: string;
}

export interface SleepDisplayData {
  actualSleepMinutes: number;
  personalOptimalSleepMinutes: number;
  sleepDebtMinutes: number;
  awakenings: number;
  totalWakeMinutes: number;
  currentNightHR: number;
  baselineNightHR: number;
  currentNightHRV: number;
  baselineHRV: number;
  deepPercent: number;
  remPercent: number;
  sleepLatencyMinutes: number;
}

export interface SleepEngineResult {
  sleepScore: number;
  durationScore: number;
  continuityScore: number;
  hrScore: number;
  hrvScore: number;
  architectureScore: number;
  blocks: SleepBlock[];
  weakestBlockKey: SleepBlock["key"];
  displayData: SleepDisplayData;
}

function safeNum(v: number | undefined, fallback: number): number {
  return Number.isFinite(v) ? v! : fallback;
}

/** 1. Длительность (35%) */
function calcDurationScore(
  actualSleepMinutes: number,
  personalOptimalSleepMinutes: number,
  sleepDebtMinutes: number
): number {
  const capacity = personalOptimalSleepMinutes > 0 ? personalOptimalSleepMinutes : DEFAULT_OPTIMAL_SLEEP_MINUTES;
  let score = (actualSleepMinutes / capacity) * 100;
  if (sleepDebtMinutes > SLEEP_DEBT_PENALTY_THRESHOLD_MINUTES) {
    score -= DURATION_DEBT_PENALTY;
  }
  return clamp(score);
}

/** 2. Непрерывность (15%) */
function calcContinuityScore(awakenings: number, totalWakeMinutes: number): number {
  let score = 100 - awakenings * 3 - totalWakeMinutes * 0.5;
  return clamp(score);
}

/** 3. Ночной пульс (15%) */
function calcHRScore(currentNightHR: number, baselineNightHR: number): number {
  const baseline = baselineNightHR > 0 ? baselineNightHR : currentNightHR;
  let score = 100 - (currentNightHR - baseline) * 5;
  return clamp(score);
}

/** 4. HRV (25%) */
function calcHRVScore(currentNightHRV: number, baselineHRV: number): number {
  const baseline = baselineHRV > 0 ? baselineHRV : currentNightHRV;
  let score = 100 + (currentNightHRV - baseline) * 2;
  return clamp(score);
}

/** 5. Архитектура (10%) */
function calcArchitectureScore(
  deepPercent: number,
  optimalDeepPercent: number,
  remPercent: number,
  optimalRemPercent: number,
  sleepLatencyMinutes: number
): number {
  const deepRatio = optimalDeepPercent > 0 ? deepPercent / optimalDeepPercent : 1;
  const remRatio = optimalRemPercent > 0 ? remPercent / optimalRemPercent : 1;
  let score = (deepRatio * 100 * 0.6 + remRatio * 100 * 0.4) - sleepLatencyMinutes * 0.5;
  return clamp(score);
}

/**
 * Вычисляет итоговый sleepScore и все блоки.
 * При отсутствии данных использует разумные значения по умолчанию.
 */
export function calculateSleepFromBlocks(input: SleepEngineInput): SleepEngineResult {
  const actualSleepMinutes = safeNum(input.actualSleepMinutes, 420);
  const personalOptimalSleepMinutes = input.personalOptimalSleepMinutes ?? DEFAULT_OPTIMAL_SLEEP_MINUTES;
  const sleepDebtMinutes = safeNum(input.sleepDebtMinutes, 0);
  const awakenings = safeNum(input.awakenings, 0);
  const totalWakeMinutes = safeNum(input.totalWakeMinutes, 0);
  const currentNightHR = safeNum(input.currentNightHR, 60);
  const baselineNightHR = input.baselineNightHR ?? currentNightHR;
  const currentNightHRV = safeNum(input.currentNightHRV, 50);
  const baselineHRV = input.baselineHRV ?? currentNightHRV;
  const deepPercent = safeNum(input.deepPercent, 20);
  const optimalDeepPercent = input.optimalDeepPercent ?? DEFAULT_OPTIMAL_DEEP_PERCENT;
  const remPercent = safeNum(input.remPercent, 25);
  const optimalRemPercent = input.optimalRemPercent ?? DEFAULT_OPTIMAL_REM_PERCENT;
  const sleepLatencyMinutes = safeNum(input.sleepLatencyMinutes, 0);

  const durationScore = calcDurationScore(actualSleepMinutes, personalOptimalSleepMinutes, sleepDebtMinutes);
  const continuityScore = calcContinuityScore(awakenings, totalWakeMinutes);
  const hrScore = calcHRScore(currentNightHR, baselineNightHR);
  const hrvScore = calcHRVScore(currentNightHRV, baselineHRV);
  const architectureScore = calcArchitectureScore(
    deepPercent,
    optimalDeepPercent,
    remPercent,
    optimalRemPercent,
    sleepLatencyMinutes
  );

  let sleepScore =
    durationScore * 0.35 +
    continuityScore * 0.15 +
    hrScore * 0.15 +
    hrvScore * 0.25 +
    architectureScore * 0.1;
  sleepScore = clamp(Math.round(sleepScore * 10) / 10);

  const blocks: SleepBlock[] = [
    { key: "duration", score: durationScore, weight: 0.35, labelKey: "sleepDetail.duration" },
    { key: "continuity", score: continuityScore, weight: 0.15, labelKey: "sleepDetail.continuity" },
    { key: "hr", score: hrScore, weight: 0.15, labelKey: "sleepDetail.nightHR" },
    { key: "hrv", score: hrvScore, weight: 0.25, labelKey: "sleepDetail.hrv" },
    { key: "architecture", score: architectureScore, weight: 0.1, labelKey: "sleepDetail.architecture" },
  ];

  const weakestBlockKey = blocks.reduce((min, b) => (b.score < min.score ? b : min)).key;

  const displayData: SleepDisplayData = {
    actualSleepMinutes,
    personalOptimalSleepMinutes,
    sleepDebtMinutes,
    awakenings,
    totalWakeMinutes,
    currentNightHR,
    baselineNightHR,
    currentNightHRV,
    baselineHRV,
    deepPercent,
    remPercent,
    sleepLatencyMinutes,
  };

  return {
    sleepScore: Math.round(sleepScore),
    durationScore,
    continuityScore,
    hrScore,
    hrvScore,
    architectureScore,
    blocks,
    weakestBlockKey,
    displayData,
  };
}

/**
 * Маппинг сырых данных (sleepHours, sleepQuality, hrv, heartRate) в SleepEngineInput.
 * Используется когда полные данные сна недоступны.
 */
export function mapHealthToSleepInput(data: {
  sleepHours: number;
  sleepQuality: number;
  hrv: number;
  heartRate: number;
}): SleepEngineInput {
  const actualSleepMinutes = data.sleepHours * 60;
  const quality = Math.max(0, Math.min(100, data.sleepQuality));
  const awakenings = Math.round((100 - quality) / 25);
  const totalWakeMinutes = awakenings * 5;
  const deepPercent = quality * 0.25;
  const remPercent = quality * 0.28;
  const sleepLatencyMinutes = (100 - quality) / 10;

  return {
    actualSleepMinutes,
    sleepDebtMinutes: actualSleepMinutes < 420 ? 420 - actualSleepMinutes : 0,
    awakenings,
    totalWakeMinutes,
    currentNightHR: data.heartRate,
    baselineNightHR: data.heartRate,
    currentNightHRV: data.hrv,
    baselineHRV: data.hrv,
    deepPercent,
    remPercent,
    sleepLatencyMinutes,
  };
}
