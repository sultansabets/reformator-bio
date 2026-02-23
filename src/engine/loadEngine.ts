/**
 * Load Engine — данные для графика нагрузки и разбора.
 * Чистые функции. Без UI.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));

const OPTIMAL_LOAD_MIN = 30;
const OPTIMAL_LOAD_MAX = 65;
const HIGH_LOAD_THRESHOLD = 75;

export type LoadZone = "optimal" | "high" | "overload";

export interface LoadDayPoint {
  day: string;
  load: number;
  zone: LoadZone;
}

export interface LoadBreakdownItem {
  key: string;
  valueKey: string;
  descKey: string;
  value: number;
}

export interface LoadEngineResult {
  loadScore: number;
  chartData: LoadDayPoint[];
  optimalMin: number;
  optimalMax: number;
  breakdown: LoadBreakdownItem[];
}

function getZone(load: number): LoadZone {
  if (load > HIGH_LOAD_THRESHOLD) return "overload";
  if (load > OPTIMAL_LOAD_MAX) return "high";
  return "optimal";
}

/**
 * Генерирует данные графика за 7–14 дней.
 * При отсутствии истории использует текущий loadPercent с вариацией.
 */
export function calculateLoadDetail(data: {
  loadPercent: number;
  trainingLoad: number;
  steps: number;
  workoutsCount: number;
  dayLabels: string[];
}): LoadEngineResult {
  const loadPercent = clamp(data.loadPercent);
  const dayLabels = data.dayLabels?.length >= 7 ? data.dayLabels : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const days = Math.min(14, Math.max(7, dayLabels.length));

  const chartData: LoadDayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const variance = (i % 3 - 1) * 8 + (Math.sin(i * 0.7) * 5);
    const load = clamp(loadPercent + variance);
    chartData.push({
      day: dayLabels[i % dayLabels.length],
      load: Math.round(load),
      zone: getZone(load),
    });
  }

  const physicalShare = Math.min(1, (data.trainingLoad / 100) * 1.2 + (data.steps / 10000) * 0.3);
  const physicalValue = Math.round(physicalShare * 100);
  const dayStressValue = Math.round(data.workoutsCount > 0 ? 60 + data.workoutsCount * 10 : 40);
  const bodyPressureValue = Math.round(clamp(data.trainingLoad * 0.9 + 10));
  const behavioralValue = Math.round(clamp(100 - data.steps / 150));

  const breakdown: LoadBreakdownItem[] = [
    { key: "physical", valueKey: physicalValue >= 70 ? "loadDetail.high" : physicalValue >= 40 ? "loadDetail.medium" : "loadDetail.low", descKey: "loadDetail.physicalDesc", value: physicalValue },
    { key: "dayStress", valueKey: dayStressValue >= 70 ? "loadDetail.high" : "loadDetail.medium", descKey: "loadDetail.dayStressDesc", value: dayStressValue },
    { key: "bodyPressure", valueKey: bodyPressureValue >= 75 ? "loadDetail.high" : "loadDetail.medium", descKey: "loadDetail.bodyPressureDesc", value: bodyPressureValue },
    { key: "behavioral", valueKey: behavioralValue >= 60 ? "loadDetail.high" : "loadDetail.medium", descKey: "loadDetail.behavioralDesc", value: behavioralValue },
  ];

  return {
    loadScore: Math.round(loadPercent),
    chartData,
    optimalMin: OPTIMAL_LOAD_MIN,
    optimalMax: OPTIMAL_LOAD_MAX,
    breakdown,
  };
}
