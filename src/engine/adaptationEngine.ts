/**
 * Adaptation Engine — данные для графика адаптации и индикаторов.
 * Чистые функции. Без UI.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 50));

export type TrendDirection = "up" | "down" | "stable";

export interface AdaptationDayPoint {
  day: string;
  value: number;
}

export interface AdaptationIndicator {
  key: string;
  value: number;
  valueKey: string;
  trend: TrendDirection;
  descKey: string;
}

export interface AdaptationEngineResult {
  adaptationScore: number;
  chartData: AdaptationDayPoint[];
  baselineMin: number;
  baselineMax: number;
  indicators: AdaptationIndicator[];
}

/**
 * Генерирует данные графика и индикаторов.
 */
export function calculateAdaptationDetail(data: {
  recovery: number;
  hrvScore: number;
  sleepScore: number;
  trainingLoad: number;
  dayLabels: string[];
}): AdaptationEngineResult {
  const recovery = clamp(data.recovery);
  const hrvScore = clamp(data.hrvScore);
  const dayLabels = data.dayLabels?.length >= 7 ? data.dayLabels : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const days = Math.min(14, Math.max(7, dayLabels.length));

  const baseline = recovery;
  const baselineMin = Math.max(0, baseline - 12);
  const baselineMax = Math.min(100, baseline + 12);

  const chartData: AdaptationDayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const variance = Math.sin(i * 0.5) * 8 + (i % 2) * 5;
    chartData.push({
      day: dayLabels[i % dayLabels.length],
      value: Math.round(clamp(recovery + variance)),
    });
  }

  const recoveryDepth = Math.round(recovery);
  const stability = Math.round(100 - Math.min(30, data.trainingLoad * 0.3));
  const trendValue = days >= 3 ? chartData[days - 1].value - chartData[days - 4].value : 0;
  const trend: TrendDirection = trendValue > 3 ? "up" : trendValue < -3 ? "down" : "stable";

  const indicators: AdaptationIndicator[] = [
    { key: "recoveryDepth", value: recoveryDepth, valueKey: `${recoveryDepth}%`, trend: "stable", descKey: "adaptationDetail.recoveryDepthDesc" },
    { key: "stability", value: stability, valueKey: stability >= 80 ? "adaptationDetail.stable" : "adaptationDetail.unstable", trend: "stable", descKey: "adaptationDetail.stabilityDesc" },
    { key: "trend3d", value: trendValue, valueKey: trend === "up" ? "adaptationDetail.trendUp" : trend === "down" ? "adaptationDetail.trendDown" : "adaptationDetail.trendStable", trend, descKey: "adaptationDetail.trendDesc" },
  ];

  return {
    adaptationScore: Math.round(recovery),
    chartData,
    baselineMin,
    baselineMax,
    indicators,
  };
}
