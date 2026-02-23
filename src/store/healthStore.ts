/**
 * Централизованное хранилище состояния здоровья.
 * Zustand store. Автоматический пересчёт при изменении сырых данных.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  calculateSleepScore,
  calculateNutritionScore,
  calculateTrainingLoad,
  hrvToScore,
  calculateRecovery,
  calculateStress,
  testosteroneToScore,
  calculateMainState,
  calculateSleepPercent,
  calculateLoadPercent,
  type WorkoutEntry,
} from "@/engine/healthEngine";
import { hydrateFromStorage, type RawHealthData } from "@/lib/healthDataSync";

export interface WorkoutEntryStore {
  date: string;
  type: string;
  durationSec: number;
  caloriesBurned: number;
  startedAt?: number;
  bodyParts?: string[];
}

export interface NutritionHistoryEntry {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

// ─── Raw data (inputs) ─────────────────────────────────────────────────────
export interface HealthRawState {
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
  workouts: WorkoutEntryStore[];
  nutritionHistory: NutritionHistoryEntry[];
}

// ─── Computed (outputs) ────────────────────────────────────────────────────
export interface HealthComputedState {
  sleepScore: number;
  nutritionScore: number;
  trainingLoad: number;
  recovery: number;
  stress: number;
  mainStateScore: number;
  sleepPercent: number;
  loadPercent: number;
  hrvScore: number;
  testosteroneScore: number;
}

export type HealthState = HealthRawState & HealthComputedState;

function toWorkoutEntry(w: WorkoutEntryStore): WorkoutEntry {
  return {
    durationSec: w.durationSec,
    caloriesBurned: w.caloriesBurned,
  };
}

function recompute(raw: HealthRawState): HealthComputedState {
  const todayWorkouts = raw.workouts.filter((w) => {
    const today = new Date().toISOString().slice(0, 10);
    return w.date === today;
  });
  const workoutEntries = todayWorkouts.map(toWorkoutEntry);

  const sleepScore = calculateSleepScore({
    sleepHours: raw.sleepHours,
    sleepQuality: raw.sleepQuality,
  });
  const nutritionScore = calculateNutritionScore({
    caloriesIntake: raw.caloriesIntake,
    targetCalories: raw.targetCalories || 2000,
    protein: raw.protein,
    targetProtein: raw.targetProtein || 150,
    carbs: raw.carbs,
    fats: raw.fats,
  });
  const trainingLoad = calculateTrainingLoad(workoutEntries, raw.steps);
  const hrvScore = hrvToScore(raw.hrv);
  const recovery = calculateRecovery({
    sleepScore,
    hrvScore,
    trainingLoad,
  });
  const stress = calculateStress({
    hrvScore,
    trainingLoad,
    sleepScore,
  });
  const testosteroneScore = testosteroneToScore(raw.testosterone);
  const mainStateScore = calculateMainState({
    sleepScore,
    nutritionScore,
    recovery,
    testosteroneNormalized: testosteroneScore,
  });
  const sleepPercent = calculateSleepPercent({
    sleepHours: raw.sleepHours,
    sleepQuality: raw.sleepQuality,
  });
  const loadPercent = calculateLoadPercent(workoutEntries, raw.steps);

  return {
    sleepScore,
    nutritionScore,
    trainingLoad,
    recovery,
    stress,
    mainStateScore,
    sleepPercent,
    loadPercent,
    hrvScore,
    testosteroneScore,
  };
}

const initialRaw: HealthRawState = {
  sleepHours: 7.5,
  sleepQuality: 80,
  hrv: 45,
  heartRate: 62,
  steps: 6500,
  caloriesIntake: 0,
  caloriesBurned: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  targetCalories: 2000,
  targetProtein: 150,
  testosterone: undefined,
  testosteroneDate: undefined,
  workouts: [],
  nutritionHistory: [],
};

const initialComputed = recompute(initialRaw);

type HealthActions = {
  hydrate: (userId: string, profile: { weight?: number; height?: number; age?: number; activityLevel?: string }) => void;
  setRaw: (patch: Partial<HealthRawState>) => void;
  addNutrition: (entry: { calories: number; protein: number; carbs: number; fats: number }) => void;
  addWorkout: (entry: WorkoutEntryStore) => void;
  setWorkouts: (workouts: WorkoutEntryStore[]) => void;
  setNutritionToday: (entry: { caloriesIntake: number; protein: number; carbs: number; fats: number }) => void;
  setSleep: (sleepHours: number, sleepQuality: number) => void;
  setPersonalData: (data: { targetCalories?: number; targetProtein?: number; weight?: number }) => void;
};

export const useHealthStore = create<HealthState & HealthActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialRaw,
    ...initialComputed,

    hydrate: (userId, profile) => {
      const raw = hydrateFromStorage({
        userId,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        activityLevel: profile.activityLevel,
      });
      const rawState: HealthRawState = {
        sleepHours: raw.sleepHours,
        sleepQuality: raw.sleepQuality,
        hrv: raw.hrv,
        heartRate: raw.heartRate,
        steps: raw.steps,
        caloriesIntake: raw.caloriesIntake,
        caloriesBurned: raw.caloriesBurned,
        protein: raw.protein,
        carbs: raw.carbs,
        fats: raw.fats,
        targetCalories: raw.targetCalories,
        targetProtein: raw.targetProtein,
        testosterone: raw.testosterone,
        testosteroneDate: raw.testosteroneDate,
        workouts: raw.workouts,
        nutritionHistory: raw.nutritionHistory,
      };
      set({ ...rawState, ...recompute(rawState) });
    },

    setRaw: (patch) => {
      const next = { ...get(), ...patch } as HealthRawState;
      set({ ...next, ...recompute(next) });
    },

    addNutrition: (entry) => {
      const s = get();
      const next: HealthRawState = {
        ...s,
        caloriesIntake: s.caloriesIntake + entry.calories,
        protein: s.protein + entry.protein,
        carbs: s.carbs + entry.carbs,
        fats: s.fats + entry.fats,
      };
      set({ ...next, ...recompute(next) });
    },

    addWorkout: (entry) => {
      const s = get();
      const nextWorkouts = [entry, ...s.workouts];
      const todayWorkouts = nextWorkouts.filter((w) => {
        const today = new Date().toISOString().slice(0, 10);
        return w.date === today;
      });
      const caloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      const next: HealthRawState = {
        ...s,
        workouts: nextWorkouts,
        caloriesBurned,
      };
      set({ ...next, ...recompute(next) });
    },

    setWorkouts: (workouts) => {
      const s = get();
      const today = new Date().toISOString().slice(0, 10);
      const todayWorkouts = workouts.filter((w) => w.date === today);
      const caloriesBurned = todayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      const next: HealthRawState = {
        ...s,
        workouts,
        caloriesBurned,
      };
      set({ ...next, ...recompute(next) });
    },

    setNutritionToday: (entry) => {
      const next: HealthRawState = {
        ...get(),
        caloriesIntake: entry.caloriesIntake,
        protein: entry.protein,
        carbs: entry.carbs,
        fats: entry.fats,
      };
      set({ ...next, ...recompute(next) });
    },

    setSleep: (sleepHours, sleepQuality) => {
      const next: HealthRawState = {
        ...get(),
        sleepHours,
        sleepQuality,
      };
      set({ ...next, ...recompute(next) });
    },

    setPersonalData: (data) => {
      const s = get();
      let targetCalories = s.targetCalories;
      let targetProtein = s.targetProtein;
      if (data.targetCalories != null) targetCalories = data.targetCalories;
      if (data.targetProtein != null) targetProtein = data.targetProtein;
      if (data.weight != null && !data.targetProtein) targetProtein = Math.round(data.weight * 2);
      const next: HealthRawState = {
        ...s,
        targetCalories,
        targetProtein,
      };
      set({ ...next, ...recompute(next) });
    },
  }))
);
