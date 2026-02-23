/**
 * Health Engine — чистые функции расчёта метрик.
 * Никакой UI логики. Все значения clamp 0–100.
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SleepData {
  sleepHours: number;
  sleepQuality: number; // 0–100
}

export interface NutritionData {
  caloriesIntake: number;
  targetCalories: number;
  protein: number;
  targetProtein: number;
  carbs: number;
  fats: number;
}

export interface WorkoutEntry {
  durationSec: number;
  caloriesBurned: number;
  intensity?: number; // 1–10, optional override
}

// ═══════════════════════════════════════════════════════════════════════════
// PURE CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** SleepScore = (min(sleepHours/8, 1) * 60) + (sleepQuality/100 * 40) */
export function calculateSleepScore(data: SleepData): number {
  const hoursPart = Math.min(data.sleepHours / 8, 1) * 60;
  const qualityPart = (data.sleepQuality / 100) * 40;
  return clamp(Math.round(hoursPart + qualityPart), 0, 100);
}

/** NutritionScore = (min(caloriesIntake/target, 1) * 50) + (proteinRatio * 50) */
export function calculateNutritionScore(data: NutritionData): number {
  const target = data.targetCalories > 0 ? data.targetCalories : 2000;
  const calPart = Math.min(data.caloriesIntake / target, 1) * 50;
  const proteinRatio = data.targetProtein > 0
    ? Math.min(data.protein / data.targetProtein, 1)
    : 0.8;
  const proteinPart = proteinRatio * 50;
  return clamp(Math.round(calPart + proteinPart), 0, 100);
}

/** TrainingLoad = (totalMinutes/60) * intensityFactor; result 0–100 */
export function calculateTrainingLoad(
  workouts: WorkoutEntry[],
  steps: number = 0
): number {
  const totalMinutes = workouts.reduce((sum, w) => sum + w.durationSec / 60, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const avgIntensity = workouts.length > 0
    ? workouts.reduce((s, w) => s + (w.intensity ?? Math.min(10, (w.durationSec / 60 / 45) * 6 + (w.caloriesBurned || 0) / 100)), 0) / workouts.length
    : 1;
  const intensityFactor = Math.min(2, avgIntensity * 0.2);
  const load = (totalMinutes / 60) * intensityFactor * 10;
  const stepsPart = Math.min(steps / 10000, 1) * 20;
  return clamp(Math.round(load + stepsPart), 0, 100);
}

/** HRV raw (ms) → 0–100 score. Typical HRV 20–100 ms. */
export function hrvToScore(hrvMs: number | undefined): number {
  if (hrvMs == null || !Number.isFinite(hrvMs)) return 50;
  if (hrvMs <= 0) return 0;
  const normalized = Math.min(100, (hrvMs / 80) * 100);
  return clamp(Math.round(normalized), 0, 100);
}

/**
 * Recovery = (sleepScore * 0.4) + (hrvScore * 0.3) + ((100 - trainingLoad) * 0.3)
 * High load → lower recovery.
 */
export function calculateRecovery(data: {
  sleepScore: number;
  hrvScore: number;
  trainingLoad: number;
}): number {
  const sleepPart = data.sleepScore * 0.4;
  const hrvPart = data.hrvScore * 0.3;
  const loadPart = (100 - data.trainingLoad) * 0.3;
  return clamp(Math.round(sleepPart + hrvPart + loadPart), 0, 100);
}

/**
 * Stress = (100 - hrvScore) * 0.4 + trainingLoad * 0.3 + (100 - sleepScore) * 0.3
 */
export function calculateStress(data: {
  hrvScore: number;
  trainingLoad: number;
  sleepScore: number;
}): number {
  const hrvPart = (100 - data.hrvScore) * 0.4;
  const loadPart = data.trainingLoad * 0.3;
  const sleepPart = (100 - data.sleepScore) * 0.3;
  return clamp(Math.round(hrvPart + loadPart + sleepPart), 0, 100);
}

/** Testosterone nmol/L → 0–100. Ref: low <12, normal 12–30, high >30 */
export function testosteroneToScore(nmolL: number | undefined): number {
  if (nmolL == null || !Number.isFinite(nmolL)) return 50;
  const normalized = ((nmolL - 12) / (30 - 12)) * 100;
  return clamp(Math.round(normalized), 0, 100);
}

/**
 * MainStateScore = sleepScore*0.25 + nutritionScore*0.25 + recovery*0.25 + testosterone*0.25
 */
export function calculateMainState(data: {
  sleepScore: number;
  nutritionScore: number;
  recovery: number;
  testosteroneNormalized: number;
}): number {
  const s = data.sleepScore * 0.25;
  const n = data.nutritionScore * 0.25;
  const r = data.recovery * 0.25;
  const t = data.testosteroneNormalized * 0.25;
  return clamp(Math.round(s + n + r + t), 0, 100);
}

/** Sleep percentage for UI (same as SleepScore, or simplified) */
export function calculateSleepPercent(data: SleepData): number {
  return calculateSleepScore(data);
}

/** Load percentage for UI: based on training load + steps */
export function calculateLoadPercent(
  workouts: WorkoutEntry[],
  steps: number,
  targetActiveKcal: number = 400,
  targetSteps: number = 10000
): number {
  const activeKcal = workouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0) || 0;
  const kcalPart = Math.min(activeKcal / targetActiveKcal, 1) * 50;
  const stepsPart = Math.min(steps / targetSteps, 1) * 50;
  return clamp(Math.round(kcalPart + stepsPart), 0, 100);
}
