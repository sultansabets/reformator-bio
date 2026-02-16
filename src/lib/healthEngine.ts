/**
 * Health computation engine.
 * All health metrics are derived here; UI only consumes the result.
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface HealthEngineLabs {
  /** Testosterone in nmol/L (for index calculation) */
  testosterone?: number;
  bilirubin?: number;
  uricAcid?: number;
  platelets?: number;
}

export interface HealthEngineInput {
  sleepHours: number;
  caloriesConsumed: number;
  caloriesTarget: number;
  workoutIntensity: number;
  waterMl: number;
  age: number;
  weight: number;
  height: number;
  labs?: HealthEngineLabs;
}

export interface HealthEngineOutput {
  energyScore: number;
  stressScore: number;
  recoveryScore: number;
  testosteroneIndex: number | null;
  liverLoad: number;
  metabolicStress: number;
}

/** Testosterone (nmol/L) → 0–100 index; undefined → null */
function computeTestosteroneIndex(testosteroneNmolL: number | undefined): number | null {
  if (testosteroneNmolL == null || !Number.isFinite(testosteroneNmolL)) return null;
  return Math.round(clamp(((testosteroneNmolL - 12) / (30 - 12)) * 100, 0, 100));
}

/** Testosterone factor for energy/recovery: <18 → -8, 18–30 → +5, >30 → +2 (using nmol/L) */
function getTestosteroneFactor(testosteroneNmolL: number | undefined): number {
  if (testosteroneNmolL == null || !Number.isFinite(testosteroneNmolL)) return 0;
  if (testosteroneNmolL < 18) return -8;
  if (testosteroneNmolL <= 30) return 5;
  return 2;
}

/** Liver load from bilirubin; bilirubin > 20 → min((b - 20) * 2, 15) */
function getLiverLoad(bilirubin: number | undefined): number {
  if (bilirubin == null || !Number.isFinite(bilirubin) || bilirubin <= 20) return 0;
  return Math.min((bilirubin - 20) * 2, 15);
}

/** Metabolic stress from uric acid; uricAcid > 339 → (v - 339) * 0.05 */
function getMetabolicStress(uricAcid: number | undefined): number {
  if (uricAcid == null || !Number.isFinite(uricAcid) || uricAcid <= 339) return 0;
  return (uricAcid - 339) * 0.05;
}

/** Recovery penalty if platelets < 180 */
function getRecoveryPenalty(platelets: number | undefined): number {
  if (platelets == null || !Number.isFinite(platelets) || platelets >= 180) return 0;
  return 5;
}

/** Sleep factor: ideal 7.5h, clamp((sleepHours - 7.5) * 8, -20, 15) */
function getSleepFactor(sleepHours: number): number {
  const idealSleep = 7.5;
  return clamp((sleepHours - idealSleep) * 8, -20, 15);
}

/** Extra stress from sleep deficit: <6h → +15, <5h → +25 */
function getSleepDeficitStress(sleepHours: number): number {
  if (sleepHours < 5) return 25;
  if (sleepHours < 6) return 15;
  return 0;
}

/** Nutrition factor for energy: ±5% target → +5; deficit >20% → -10; surplus >25% → -8 */
function getNutritionFactor(
  caloriesConsumed: number,
  caloriesTarget: number
): { factor: number; stressBonus: number } {
  if (caloriesTarget <= 0) return { factor: 0, stressBonus: 0 };
  const diff = caloriesConsumed - caloriesTarget;
  const pct = Math.abs(diff) / caloriesTarget;
  if (pct <= 0.05) return { factor: 5, stressBonus: 0 };
  if (diff < 0) {
    if (pct > 0.2) return { factor: -10, stressBonus: diff < -500 ? 10 : 0 };
    return { factor: 0, stressBonus: diff < -500 ? 10 : 0 };
  }
  if (pct > 0.25) return { factor: -8, stressBonus: 0 };
  return { factor: 0, stressBonus: 0 };
}

/** Workout adaptation: 3–6 → +5 energy; >7 → -6 (no recovery). Stress += intensity * 1.5 is applied in stress formula. */
function getWorkoutAdaptation(workoutIntensity: number): number {
  if (workoutIntensity >= 3 && workoutIntensity <= 6) return 5;
  if (workoutIntensity > 7) return -6;
  return 0;
}

/**
 * Computes all health metrics from current inputs.
 * No UI; pure logic only.
 */
export function computeHealthMetrics(input: HealthEngineInput): HealthEngineOutput {
  const {
    sleepHours,
    caloriesConsumed,
    caloriesTarget,
    workoutIntensity,
    labs,
  } = input;

  const testosteroneNmolL = labs?.testosterone;
  const testosteroneIndex = computeTestosteroneIndex(testosteroneNmolL);
  const testosteroneFactor = getTestosteroneFactor(testosteroneNmolL);
  const liverLoad = getLiverLoad(labs?.bilirubin);
  const metabolicStress = getMetabolicStress(labs?.uricAcid);
  const recoveryPenalty = getRecoveryPenalty(labs?.platelets);
  const sleepFactor = getSleepFactor(sleepHours);
  const sleepDeficit = getSleepDeficitStress(sleepHours);
  const { factor: nutritionFactor, stressBonus: nutritionStress } = getNutritionFactor(
    caloriesConsumed,
    caloriesTarget
  );
  const workoutAdaptation = getWorkoutAdaptation(workoutIntensity);

  const baseEnergy = 60;
  const baseStress = 35;
  const baseRecovery = 70;

  const recoveryScore = clamp(
    baseRecovery + sleepFactor + testosteroneFactor - liverLoad - recoveryPenalty,
    0,
    100
  );

  const stressScore = clamp(
    baseStress +
      workoutIntensity * 1.5 +
      sleepDeficit +
      metabolicStress +
      nutritionStress -
      recoveryScore * 0.3,
    0,
    100
  );

  const energyScore = clamp(
    baseEnergy +
      sleepFactor +
      nutritionFactor +
      workoutAdaptation +
      testosteroneFactor -
      stressScore * 0.25 -
      liverLoad,
    0,
    100
  );

  return {
    energyScore: Math.round(energyScore),
    stressScore: Math.round(stressScore),
    recoveryScore: Math.round(recoveryScore),
    testosteroneIndex,
    liverLoad,
    metabolicStress,
  };
}
