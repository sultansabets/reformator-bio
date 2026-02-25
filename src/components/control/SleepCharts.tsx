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
const CHART_MARGIN = { top: 20, right: 20, left: 10, bottom: 20 };
const BAR_FILL = "#37BE7E";
const LINE_STROKE = "#37BE7E";
const GRID_STROKE = "rgba(255,255,255,0.08)";
const REF_LINE_STROKE = "rgba(255,255,255,0.35)";

const DAY_LABELS_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function minutesToHours(min: number): number {
  return Math.round((min / 60) * 10) / 10;
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
    const baseQuality = sleepDetail.sleepScore;
    const baseActual = d.actualSleepMinutes;
    const baseTimeInBed = baseActual + d.totalWakeMinutes;
    const baseEfficiency = Math.round(
      100 - (d.totalWakeMinutes / Math.max(1, baseTimeInBed)) * 100
    );
    const baseSleepStart = 22 * 60 + 15;
    const baseWakeUp = baseSleepStart + baseActual;
    const baseLatency = d.sleepLatencyMinutes;
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

      const regStart = baseSleepStart + (seed % 30) - 15;
      const regEnd = baseWakeUp + (seed % 20) - 10;
      data.push({
        label,
        quality: Math.max(50, Math.min(100, vary(baseQuality, 0.15))),
        regularityStart: regStart,
        regularityEnd: regEnd,
        regularitySpan: Math.max(60, regEnd - regStart),
        regularityPercent: Math.max(70, Math.min(100, baseEfficiency + (seed % 20) - 10)),
        sleepStart: baseSleepStart + (seed % 60) - 30,
        wakeUp: baseWakeUp + (seed % 45) - 22,
        efficiency: Math.max(70, Math.min(100, vary(baseEfficiency, 0.1))),
        timeInBed: Math.max(4, Math.min(8, minutesToHours(baseTimeInBed) + (seed % 20) / 10 - 1)),
        actualSleep: Math.max(4, Math.min(7, minutesToHours(baseActual) + (seed % 15) / 10 - 0.7)),
        sleepLatency: Math.max(0, Math.min(60, baseLatency + (seed % 25) - 12)),
        snoring: Math.min(5, (seed % 50) / 15),
        cough: Math.min(1.5, (seed % 30) / 25),
        noise: 27 + (seed % 30) / 10,
        heartRate: Math.max(50, Math.min(90, baseHR + (seed % 20) - 10)),
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
      timeInBed: sum("timeInBed"),
      actualSleep: sum("actualSleep"),
      sleepLatency: sum("sleepLatency"),
      snoring: sum("snoring"),
      cough: sum("cough"),
      noise: sum("noise"),
      heartRate: sum("heartRate"),
    };
  }, [chartData]);

  if (!sleepDetail) return null;

  const commonAxisProps = {
    tick: { fontSize: 11, fill: "rgba(255,255,255,0.5)" },
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
        <div className="w-full" style={{ opacity: hasEnoughNights ? 1 : 0.5 }}>
          {children}
        </div>
      )}
    </section>
  );

  if (chartData.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("sleepDetail.chartsBlock")}
      </h2>

      <ChartSection title={t("sleepDetail.qualityBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.quality}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[50, 100]} {...commonAxisProps} tickFormatter={(v) => `${v}%`} />
            <Bar dataKey="quality" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.regularityBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
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
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis
              domain={["dataMin - 60", "dataMax + 60"]}
              {...commonAxisProps}
              tickFormatter={(v) => minutesToHHMM(Number(v))}
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
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis
              domain={[22 * 60, 1 * 60 + 59]}
              {...commonAxisProps}
              tickFormatter={(v) => minutesToHHMM(Number(v))}
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
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis
              domain={[4 * 60, 7 * 60 + 59]}
              {...commonAxisProps}
              tickFormatter={(v) => minutesToHHMM(Number(v))}
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
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.efficiency}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[70, 100]} {...commonAxisProps} tickFormatter={(v) => `${v}%`} />
            <Bar dataKey="efficiency" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.timeInBedBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.timeInBed}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[4, 8]} {...commonAxisProps} tickFormatter={(v) => `${v}ч`} />
            <Bar dataKey="timeInBed" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.actualSleepBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.actualSleep}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[4, 7]} {...commonAxisProps} tickFormatter={(v) => `${v}ч`} />
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
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[0, 60]} {...commonAxisProps} tickFormatter={(v) => `${v}м`} />
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

      <ChartSection title={t("sleepDetail.snoringBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.snoring}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[0, 5]} {...commonAxisProps} tickFormatter={(v) => `${v}ч`} />
            <Bar dataKey="snoring" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.coughBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.cough}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[0, 1.5]} {...commonAxisProps} tickFormatter={(v) => `${v}`} />
            <Bar dataKey="cough" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title={t("sleepDetail.noiseBlock")} isEmpty={!hasEnoughNights}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            {avg && (
              <ReferenceLine
                y={avg.noise}
                stroke={REF_LINE_STROKE}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[27, 30]} {...commonAxisProps} tickFormatter={(v) => `${v} дБ`} />
            <Bar dataKey="noise" fill={BAR_FILL} radius={[2, 2, 0, 0]} />
          </BarChart>
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
            <XAxis dataKey="label" {...commonAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[50, 90]} {...commonAxisProps} tickFormatter={(v) => `${v}`} />
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
