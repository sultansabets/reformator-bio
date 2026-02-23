/**
 * Sync layer: reads raw data from localStorage for health store.
 */

import { getStorageKey } from "./userStorage";
import { getRecommendedKcal } from "./health";
import { getLatestLab } from "./labs";

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function testosteroneNgDlToNmolL(ngDl: number): number {
  return ngDl * 0.0347;
}

interface FoodEntryV2 {
  id: string;
  product_id?: string;
  name?: string;
  grams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp?: number;
}

interface DayDataV2 {
  entries: FoodEntryV2[];
}

interface OldNutritionDay {
  date?: string;
  breakfast?: { manualKcal?: number; kcalPer100?: number; grams?: number }[];
  lunch?: { manualKcal?: number; kcalPer100?: number; grams?: number }[];
  dinner?: { manualKcal?: number; kcalPer100?: number; grams?: number }[];
  snacks?: { manualKcal?: number; kcalPer100?: number; grams?: number }[];
}

export interface WorkoutEntryRaw {
  date: string;
  type: string;
  durationSec: number;
  caloriesBurned: number;
  startedAt?: number;
  bodyParts?: string[];
}

function sumKcalFromOld(arr: { manualKcal?: number; kcalPer100?: number; grams?: number }[] | undefined): number {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((s, i) => {
    const k = i.manualKcal ?? (i.kcalPer100 && i.grams ? (i.grams / 100) * i.kcalPer100 : 0);
    return s + Math.round(k);
  }, 0);
}

export interface HydrateInput {
  userId: string;
  weight?: number;
  height?: number;
  age?: number;
  activityLevel?: string;
}

export interface RawHealthData {
  sleepHours: number;
  sleepQuality: number;
  hrv: number;
  heartRate: number;
  steps: number;
  caloriesIntake: number;
  caloriesBurned: number;
  protein: number;
  carbs: number;
  fats: number;
  targetCalories: number;
  targetProtein: number;
  testosterone: number | undefined;
  testosteroneDate: string | undefined;
  workouts: WorkoutEntryRaw[];
  todayWorkouts: WorkoutEntryRaw[];
  nutritionHistory: { date: string; calories: number; protein: number; carbs: number; fats: number }[];
}

/** Load today's nutrition from nutrition_v2 or fallback to nutrition (old format) */
function loadTodayNutrition(nutritionV2Key: string, nutritionKey: string): {
  caloriesIntake: number;
  protein: number;
  carbs: number;
  fats: number;
} {
  const today = getTodayDateString();

  const v2Raw = localStorage.getItem(`${nutritionV2Key}_${today}`);
  if (v2Raw) {
    const day: DayDataV2 = safeParse(v2Raw, { entries: [] });
    const entries = Array.isArray(day.entries) ? day.entries : [];
    return entries.reduce(
      (acc, e) => ({
        caloriesIntake: acc.caloriesIntake + (e.calories || 0),
        protein: acc.protein + (e.protein || 0),
        carbs: acc.carbs + (e.carbs || 0),
        fats: acc.fats + (e.fats || 0),
      }),
      { caloriesIntake: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }

  const oldRaw = localStorage.getItem(nutritionKey);
  if (oldRaw) {
    const parsed: OldNutritionDay = safeParse(oldRaw, {});
    if (parsed.date === today) {
      const totalKcal =
        sumKcalFromOld(parsed.breakfast) +
        sumKcalFromOld(parsed.lunch) +
        sumKcalFromOld(parsed.dinner) +
        sumKcalFromOld(parsed.snacks);
      return {
        caloriesIntake: totalKcal,
        protein: 0,
        carbs: 0,
        fats: 0,
      };
    }
  }

  return { caloriesIntake: 0, protein: 0, carbs: 0, fats: 0 };
}

function loadWorkoutHistory(key: string): WorkoutEntryRaw[] {
  const raw = localStorage.getItem(key);
  const list = safeParse<WorkoutEntryRaw[]>(raw, []);
  return Array.isArray(list) ? list : [];
}

export function hydrateFromStorage(input: HydrateInput): RawHealthData {
  const keys = {
    nutritionV2: getStorageKey(input.userId, "nutrition_v2"),
    nutrition: getStorageKey(input.userId, "nutrition"),
    workout_history: getStorageKey(input.userId, "workout_history"),
    labs: getStorageKey(input.userId, "labs"),
  };

  const today = getTodayDateString();
  const todayNutrition = loadTodayNutrition(keys.nutritionV2, keys.nutrition);
  const allWorkouts = loadWorkoutHistory(keys.workout_history);
  const todayWorkouts = allWorkouts.filter((w) => w.date === today);

  const caloriesBurned = todayWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
  const recommended = input.weight && input.height
    ? getRecommendedKcal(input.weight, input.height)
    : null;
  const targetCalories = recommended?.target ?? 2000;
  const targetProtein = input.weight ? Math.round(input.weight * 2) : 150;

  const lab = getLatestLab(keys.labs);
  const testosteroneNmolL =
    lab?.testosterone != null ? testosteroneNgDlToNmolL(lab.testosterone) : undefined;
  const testosteroneDate = lab?.date;

  const sleepHours = 7.5;
  const sleepQuality = 80;
  const hrv = 45;
  const heartRate = 62;
  const steps = 6500;

  const nutritionHistory: RawHealthData["nutritionHistory"] = [];

  return {
    sleepHours,
    sleepQuality,
    hrv,
    heartRate,
    steps,
    caloriesIntake: todayNutrition.caloriesIntake,
    caloriesBurned,
    protein: todayNutrition.protein,
    carbs: todayNutrition.carbs,
    fats: todayNutrition.fats,
    targetCalories,
    targetProtein,
    testosterone: testosteroneNmolL,
    testosteroneDate,
    workouts: allWorkouts,
    todayWorkouts,
    nutritionHistory,
  };
}
