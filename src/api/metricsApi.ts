/**
 * Metrics API endpoints.
 */

import { apiFetch } from "./apiClient";

export interface MetricsSummary {
  date?: string;
  baseline?: unknown;
  mainStateScore?: number;
  sleepScore?: number;
  sleepPercent?: number;
  loadPercent?: number;
  stress?: number;
  sleepHours?: number;
  sleepQuality?: number;
  hrv?: number;
  heartRate?: number;
  steps?: number;
  caloriesIntake?: number;
  caloriesBurned?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  targetCalories?: number;
  targetProtein?: number;
  testosterone?: number;
  testosteroneDate?: string;
  workouts?: Array<{
    date: string;
    type: string;
    durationSec: number;
    caloriesBurned: number;
    startedAt?: number;
    bodyParts?: string[];
  }>;
  nutritionHistory?: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }>;
}

export interface MetricsRangeItem extends MetricsSummary {
  date: string;
}

/**
 * GET /metrics/summary
 * Optional ?date=YYYY-MM-DD — omit if backend returns today's metrics by default.
 */
export async function getMetricsSummary(date?: string): Promise<MetricsSummary> {
  const url = date
    ? `/metrics/summary?${new URLSearchParams({ date })}`
    : "/metrics/summary";
  return apiFetch<MetricsSummary>(url);
}

/**
 * GET /metrics/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function getMetricsRange(
  startDate: string,
  endDate: string
): Promise<MetricsRangeItem[]> {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await apiFetch<MetricsRangeItem[] | { data: MetricsRangeItem[] }>(
    `/metrics/range?${params}`
  );
  return Array.isArray(res) ? res : res.data ?? [];
}
