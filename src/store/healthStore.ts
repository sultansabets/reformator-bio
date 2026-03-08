/**
 * Централизованное хранилище состояния здоровья.
 * Zustand store. Автоматический пересчёт при изменении сырых данных.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  calculateNutritionScore,
  calculateTrainingLoad,
  hrvToScore,
  calculateStress,
  testosteroneToScore,
  calculateEnergy,
  calculateLoadPercent,
  type WorkoutEntry,
} from "@/engine/healthEngine";
import { calculateSleepFromBlocks, mapHealthToSleepInput, type SleepEngineResult } from "@/engine/sleepEngine";
import { calculateEnergyDetail, type EnergyEngineResult } from "@/engine/energyEngine";
import type { MetricsSummary } from "@/api/metricsApi";

function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
}

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
  /** Date for which computed metrics are shown (YYYY-MM-DD). Used by date navigation. */
  viewDate: string;
}

// ─── Computed (outputs) ────────────────────────────────────────────────────
export interface HealthComputedState {
  sleepScore: number;
  sleepDetail: SleepEngineResult;
  energyDetail: EnergyEngineResult;
  nutritionScore: number;
  trainingLoad: number;
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
  const viewDate = raw.viewDate ?? getTodayISO();
  const dateWorkouts = raw.workouts.filter((w) => w.date === viewDate);
  const workoutEntries = dateWorkouts.map(toWorkoutEntry);

  const sleepInput = mapHealthToSleepInput({
    sleepHours: raw.sleepHours,
    sleepQuality: raw.sleepQuality,
    hrv: raw.hrv,
    heartRate: raw.heartRate,
  });
  const sleepDetail = calculateSleepFromBlocks(sleepInput);
  const sleepScore = sleepDetail.sleepScore;
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
  const stress = calculateStress({
    hrvScore,
    trainingLoad,
    sleepScore,
  });
  const testosteroneScore = testosteroneToScore(raw.testosterone);

  const loadPercent = calculateLoadPercent(workoutEntries, raw.steps);
  const sleepPercent = sleepScore;

  const mainStateScore = calculateEnergy({
    sleep: sleepPercent,
    load: loadPercent,
  });
  const energyDetail = calculateEnergyDetail({
    sleep: sleepPercent,
    load: loadPercent,
  });

  return {
    sleepScore,
    sleepDetail,
    energyDetail,
    nutritionScore,
    trainingLoad,
    stress,
    mainStateScore,
    sleepPercent,
    loadPercent,
    hrvScore,
    testosteroneScore,
  };
}

const initialRaw: HealthRawState = {
  sleepHours: 0,
  sleepQuality: 0,
  hrv: 0,
  heartRate: 0,
  steps: 0,
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
  viewDate: getTodayISO(),
};

function getInitialState(): HealthState {
  const computed = recompute(initialRaw);
  return { ...initialRaw, ...computed };
}

function metricsSummaryToRaw(api: MetricsSummary, viewDate: string): HealthRawState {
  const sleepHours = api.sleepHours ?? (api.sleepMinutes != null ? api.sleepMinutes / 60 : 7.5);
  return {
    sleepHours,
    sleepQuality: api.sleepQuality ?? 80,
    hrv: api.hrv ?? api.avgHRV ?? 45,
    heartRate: api.heartRate ?? api.avgHeartRate ?? 62,
    steps: api.steps ?? 6500,
    caloriesIntake: api.caloriesIntake ?? 0,
    caloriesBurned: api.caloriesBurned ?? 0,
    protein: api.protein ?? 0,
    carbs: api.carbs ?? 0,
    fats: api.fats ?? 0,
    targetCalories: api.targetCalories ?? 2000,
    targetProtein: api.targetProtein ?? 150,
    testosterone: api.testosterone,
    testosteroneDate: api.testosteroneDate,
    workouts: (api.workouts ?? []) as WorkoutEntryStore[],
    nutritionHistory: (api.nutritionHistory ?? []) as NutritionHistoryEntry[],
    viewDate,
  };
}

export function hasValidMetrics(api: MetricsSummary | null | undefined): boolean {
  if (!api || api === null) return false;
  return (
    api.mainStateScore != null ||
    api.stateScore != null ||
    api.sleepHours != null ||
    api.sleepMinutes != null ||
    api.steps != null ||
    api.hrv != null ||
    api.avgHRV != null ||
    api.heartRate != null ||
    api.avgHeartRate != null
  );
}

type HealthActions = {
  setFromApiMetrics: (api: MetricsSummary, viewDate: string) => void;
  clearMetrics: () => void;
  setRaw: (patch: Partial<HealthRawState>) => void;
  addNutrition: (entry: { calories: number; protein: number; carbs: number; fats: number }) => void;
  addWorkout: (entry: WorkoutEntryStore) => void;
  setWorkouts: (workouts: WorkoutEntryStore[]) => void;
  setNutritionToday: (entry: { caloriesIntake: number; protein: number; carbs: number; fats: number }) => void;
  setSleep: (sleepHours: number, sleepQuality: number) => void;
  setPersonalData: (data: { targetCalories?: number; targetProtein?: number; weight?: number }) => void;
};

export const useHealthStore = create<HealthState & HealthActions>()(
  subscribeWithSelector((set, get) => {
    const initialState = getInitialState();
    return {
      ...initialState,

      setFromApiMetrics: (api, viewDate) => {
        const rawState = metricsSummaryToRaw(api, viewDate);
        set({ ...rawState, ...recompute(rawState) });
      },

      clearMetrics: () => {
        const empty: HealthRawState = {
          ...initialRaw,
          viewDate: get().viewDate ?? getTodayISO(),
        };
        set({ ...empty, ...recompute(empty) });
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
      const viewDate = s.viewDate ?? getTodayISO();
      const dateWorkouts = nextWorkouts.filter((w) => w.date === viewDate);
      const caloriesBurned = dateWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
      const next: HealthRawState = {
        ...s,
        workouts: nextWorkouts,
        caloriesBurned,
      };
      set({ ...next, ...recompute(next) });
    },

    setWorkouts: (workouts) => {
      const s = get();
      const viewDate = s.viewDate ?? getTodayISO();
      const dateWorkouts = workouts.filter((w) => w.date === viewDate);
      const caloriesBurned = dateWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
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
  };
  })
);
