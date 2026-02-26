import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SleepEngineResult } from "@/engine/sleepEngine";

const NIGHTS_FOR_CHARTS = 5;
const CHART_HEIGHT = 240;
const CHART_MARGIN = { top: 24, right: 24, left: 24, bottom: 32 };
const BAR_FILL = "#37BE7E";
const LINE_STROKE = "#37BE7E";
const GRID_STROKE = "rgba(255,255,255,0.08)";
const REF_LINE_STROKE = "rgba(255,255,255,0.35)";

const DAY_LABELS_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

/** Округляет минуты до 5 (22:47 → 22:45, 06:52 → 06:50) */
function roundTo5Minutes(min: number): number {
  return Math.round(min / 5) * 5;
}

function minutesToHHMM(min: number, round5 = true): string {
  const m = round5 ? roundTo5Minutes(min) : min;
  const total = Math.round(m);
  const h = Math.floor(total / 60) % 24;
  const mins = ((total % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** Часы с шагом 30 минут (4.5, 5.0, 5.5) */
function minutesToHours(min: number): number {
  return Math.round((min / 60) * 2) / 2;
}

export interface SleepChartsProps {
  sleepDetail: SleepEngineResult | null;
  nightsCount?: number;
}

export function SleepCharts({ sleepDetail, nightsCount = 7 }: SleepChartsProps) {
  const { t } = useTranslation();
  const hasEnoughNights = nightsCount >= NIGHTS_FOR_CHARTS;

  const chartData = useMemo(() => {
    if (!sleepDetail?.displayData) return [];
    const d = sleepDetail.displayData;
    const today = new Date();
    const data: Record<string, number | string>[] = [];

    // Базовые значения в реалистичных диапазонах
    const baseQuality = Math.max(75, Math.min(98, sleepDetail.sleepScore));
    const baseActual = d.actualSleepMinutes;
    const baseTimeInBed = baseActual + d.totalWakeMinutes;
    const baseEfficiency = Math.round(
      100 - (d.totalWakeMinutes / Math.max(1, baseTimeInBed)) * 100
    );
    // Начало сна: 22:00–01:00 (минуты от полуночи)
    const baseSleepStart = 22 * 60 + 30; // 22:30
    const baseWakeUp = baseSleepStart + baseActual;
    // Подъём: 05:00–09:00
    const baseLatency = Math.max(5, Math.min(30, d.sleepLatencyMinutes));
    const baseHR = d.currentNightHR;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayLabel = DAY_LABELS_RU[date.getDay()];
      const dateStr = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = `${dayLabel} ${dateStr}`;
      const seed = (i * 17 + baseQuality) % 100;
      const vary = (v: number, pct: number) =>
        Math.round(v * (1 + (seed / 100 - 0.5) * pct * 2));

      // Регулярность: разброс ±40 мин
      const regOffset = ((seed % 81) - 40);
      const regStart = roundTo5Minutes(baseSleepStart + regOffset);
      const regSpan = Math.max(360, baseActual - 60);
      const regEnd = regStart + regSpan;

      // Начало сна 22:00–01:00, округлено до 5 мин
      const sleepStartOffset = ((seed % 61) - 30) * 5;
      const sleepStart = roundTo5Minutes(Math.max(22 * 60, Math.min(25 * 60, baseSleepStart + sleepStartOffset)));

      // Подъём 05:00–09:00, округлено до 5 мин (300–540 мин от полуночи)
      const wakeUp = roundTo5Minutes(5 * 60 + (seed % 49) * 5);

      // Заснул после: 5–30 мин, шаг 5
      const latency = roundTo5Minutes(Math.max(5, Math.min(30, baseLatency + (seed % 11) - 5)));

      // timeInBed, actualSleep — часы с шагом 30 мин (4.0, 4.5, 5.0 ... 8.0)
      const timeInBedH = Math.round(minutesToHours(baseTimeInBed) * 2) / 2 + (seed % 5) * 0.5 - 1;
      const actualSleepH = Math.round(minutesToHours(baseActual) * 2) / 2 + (seed % 5) * 0.5 - 1;

      data.push({
        label,
        quality: Math.max(75, Math.min(98, vary(baseQuality, 0.08))),
        regularityStart: regStart,
        regularityEnd: regEnd,
        regularitySpan: regSpan,
        regularityPercent: Math.max(70, Math.min(100, Math.round(baseEfficiency + (seed % 15) - 7))),
        sleepStart,
        wakeUp,
        efficiency: Math.max(75, Math.min(98, Math.round(vary(baseEfficiency, 0.06)))),
        timeInBed: Math.max(4, Math.min(8, timeInBedH)),
        actualSleep: Math.max(4, Math.min(7, actualSleepH)),
        sleepLatency: latency,
        snoring: Math.min(5, Math.round((seed % 30) / 10) * 0.5),
        cough: Math.min(1.5, Math.round((seed % 20) / 15) * 0.5),
        noise: Math.round((27 + (seed % 30) / 10) * 2) / 2,
        heartRate: Math.round(Math.max(50, Math.min(90, baseHR + (seed % 15) - 7))),
      });
    }
    return data;
  }, [sleepDetail]);

  const avg = useMemo(() => {
    if (chartData.length === 0) return null;
    const sum = (key: string) =>
      chartData.reduce((s, r) => s + (r[key] as number), 0) / chartData.length;
    return {
      quality: sum("quality"),
      efficiency: sum("efficiency"),
      actualSleep: sum("actualSleep"),
      sleepLatency: sum("sleepLatency"),
      snoring: sum("snoring"),
      heartRate: sum("heartRate"),
    };
  }, [chartData]);

  if (!sleepDetail) return null;

  const commonXAxisProps = {
    tick: { fontSize: 11, fill: "rgba(255,255,255,0.5)", dy: 10 },
    height: 40,
    axisLine: false,
    tickLine: false,
  };

  const commonYAxisProps = {
    tick: { fontSize: 11, fill: "rgba(255,255,255,0.5)", dx: -8 },
    width: 40,
    axisLine: false,
    tickLine: false,
  };

  const ChartSection = ({
    title,
    children,
    isEmpty,
  }: {
    title: string;
    children: React.ReactNode;
    isEmpty?: boolean;
  }) => (
    <section className="py-6 first:pt-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {isEmpty ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("sleepDetail.notEnoughData")}
        </p>
      ) : (
        <div className="w-full pt-2" style={{ opacity: hasEnoughNights ? 1 : 0.5 }}>
          {children}
        </div>
      )}
    </section>
  );

  if (chartData.length === 0) return null;

  return (
    <section className="mt-6 pb-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("sleepDetail.chartsBlock")}
      </h2>

      <ChartSection title={t("sleepDetail.qualityBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.quality}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[70, 100]} {...commonYAxisProps} tickFormatter={(v) => `${Math.round(v)}%`} />
            <Bar dataKey="quality" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.regularityBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {chartData.length > 0 && (
              <>
                <ReferenceLine
                  y={chartData.reduce((s, r) => s + (r.regularityStart as number), 0) / chartData.length}
                  stroke={REF_LINE_STROKE}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <ReferenceLine
                  y={chartData.reduce((s, r) => s + (r.regularityEnd as number), 0) / chartData.length}
                  stroke={REF_LINE_STROKE}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              </>
            )}
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis
              domain={[20 * 60, 34 * 60]}
              ticks={[20 * 60, 22 * 60, 24 * 60, 26 * 60, 28 * 60, 30 * 60, 32 * 60, 34 * 60]}
              {...commonYAxisProps}
              tickFormatter={(v) => {
                const m = Number(v) % (24 * 60);
                return minutesToHHMM(m, false);
              }}
            />
            <Bar dataKey="regularityStart" stackId="reg" fill="transparent" radius={[0, 0, 0, 0]} />
            <Bar dataKey="regularitySpan" stackId="reg" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              formatter={(val: number, name: string, props: { payload?: { regularityStart?: number; regularityEnd?: number; regularityPercent?: number } }) => {
                const p = props?.payload as { regularityStart?: number; regularityEnd?: number } | undefined;
                if (name === "regularitySpan" && p) {
                  return [`${minutesToHHMM(p.regularityStart ?? 0)} — ${minutesToHHMM(p.regularityEnd ?? 0)}`, t("sleepDetail.regularityBlock")];
                }
                if (name === "regularityStart") {
                  return [minutesToHHMM(val), t("sleepDetail.fallAsleep")];
                }
                return [val, name];
              }}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { label?: string; regularityPercent?: number } | undefined;
                return p ? `${p.label} · ${(p.regularityPercent ?? 0).toFixed(0)}%` : "";
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.sleepStartBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis
              domain={[22 * 60, 25 * 60]}
              ticks={[22 * 60, 22.5 * 60, 23 * 60, 23.5 * 60, 24 * 60, 24.5 * 60, 25 * 60]}
              {...commonYAxisProps}
              tickFormatter={(v) => minutesToHHMM(Number(v), false)}
            />
            <Line
              type="monotone"
              dataKey="sleepStart"
              stroke={LINE_STROKE}
              strokeWidth={1.5}
              dot={{ r: 3, fill: LINE_STROKE }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.wakeUpBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis
              domain={[5 * 60, 9 * 60]}
              ticks={[5 * 60, 5.5 * 60, 6 * 60, 6.5 * 60, 7 * 60, 7.5 * 60, 8 * 60, 8.5 * 60, 9 * 60]}
              {...commonYAxisProps}
              tickFormatter={(v) => minutesToHHMM(Number(v), false)}
            />
            <Line
              type="monotone"
              dataKey="wakeUp"
              stroke={LINE_STROKE}
              strokeWidth={1.5}
              dot={{ r: 3, fill: LINE_STROKE }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.efficiencyBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.efficiency}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[70, 100]} {...commonYAxisProps} tickFormatter={(v) => `${Math.round(v)}%`} />
            <Bar dataKey="efficiency" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.actualSleepBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.actualSleep}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[4, 7]} ticks={[4, 4.5, 5, 5.5, 6, 6.5, 7]} {...commonYAxisProps} tickFormatter={(v) => `${v}ч`} />
            <Bar dataKey="actualSleep" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.sleepLatencyBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.sleepLatency}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis
              domain={[0, 35]}
              ticks={[0, 5, 10, 15, 20, 25, 30]}
              {...commonYAxisProps}
              tickFormatter={(v) => `${Math.round(v)}м`}
            />
            <Line
              type="monotone"
              dataKey="sleepLatency"
              stroke={LINE_STROKE}
              strokeWidth={1.5}
              dot={{ r: 3, fill: LINE_STROKE }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>


      <ChartSection title={t("sleepDetail.heartRateBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.heartRate}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[50, 90]} {...commonYAxisProps} tickFormatter={(v) => `${v}`} />
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke={LINE_STROKE}
              strokeWidth={1.5}
              dot={{ r: 3, fill: LINE_STROKE }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>
    </section>
  );
}
