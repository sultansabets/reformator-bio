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
  CartesianGrid,
  ComposedChart,
} from "recharts";
import type { LoadEngineResult } from "@/engine/loadEngine";

const CHART_HEIGHT = 240;
const CHART_MARGIN = { top: 16, right: 8, left: 0, bottom: 24 };
const BODY_STRENGTH = "#C0C0C0";
const BODY_CARDIO = "#37BE7E";
const BODY_STEPS = "#C0C0C0";
const NEURO_STRESS = "#C0C0C0";
const NEURO_HRV = "#37BE7E";
const NEURO_SLEEP = "#28282B";
const GRID_STROKE = "rgba(255,255,255,0.08)";
const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export interface LoadChartsProps {
  loadDetail: LoadEngineResult | null;
}

export function LoadCharts({ loadDetail }: LoadChartsProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    if (!loadDetail) return [];
    const today = new Date();
    const base = loadDetail;
    const data: Record<string, number | string>[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayLabel = DAY_LABELS[date.getDay()];
      const dateStr = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = `${dayLabel} ${dateStr}`;
      const seed = (i * 17 + base.totalLoad) % 100;
      const vary = (v: number, pct: number) =>
        Math.round(v * (1 + (seed / 100 - 0.5) * pct * 2));
      data.push({
        label,
        totalLoad: Math.max(0, Math.min(100, vary(base.totalLoad, 0.12))),
        strengthLoad: Math.max(0, Math.min(100, vary(base.strengthLoad, 0.15))),
        cardioLoad: Math.max(0, Math.min(100, vary(base.cardioLoad, 0.2))),
        stepsLoad: Math.max(0, Math.min(100, vary(base.stepsLoad, 0.12))),
        stressLoad: Math.max(0, Math.min(100, vary(base.stressLoad, 0.15))),
        sleepDebtLoad: Math.max(0, Math.min(100, vary(base.sleepDebtLoad, 0.25))),
        hrvLoad: Math.max(0, Math.min(100, vary(base.hrvLoad, 0.3))),
      });
    }
    return data;
  }, [loadDetail]);

  const commonXAxisProps = {
    tick: { fontSize: 10, fill: "rgba(255,255,255,0.5)" },
    height: 32,
    axisLine: false,
    tickLine: false,
  };

  const commonYAxisProps = {
    tick: { fontSize: 10, fill: "rgba(255,255,255,0.5)" },
    width: 44,
    axisLine: false,
    tickLine: false,
  };

  const ChartSection = ({
    title,
    children,
    legend,
  }: {
    title: string;
    children: React.ReactNode;
    legend?: React.ReactNode;
  }) => (
    <section className="pb-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="w-full">{children}</div>
      {legend && <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">{legend}</div>}
    </section>
  );

  if (!loadDetail || chartData.length === 0) return null;

  return (
    <section className="mt-4 pb-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("loadDetail.trend7d")}
      </h2>

      <ChartSection title={t("loadDetail.chartTotalLoad")}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} {...commonYAxisProps} tickFormatter={(v) => `${v}%`} />
            <Line
              type="monotone"
              dataKey="totalLoad"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection
        title={t("loadDetail.chartBodyLoad")}
        legend={
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BODY_STRENGTH }} />
              {t("loadDetail.strength")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BODY_CARDIO }} />
              {t("loadDetail.cardio")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BODY_STEPS }} />
              {t("loadDetail.steps")}
            </span>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} {...commonYAxisProps} tickFormatter={(v) => `${v}%`} />
            <Bar dataKey="strengthLoad" stackId="body" fill={BODY_STRENGTH} radius={[0, 0, 0, 0]} />
            <Bar dataKey="cardioLoad" stackId="body" fill={BODY_CARDIO} radius={[0, 0, 0, 0]} />
            <Bar dataKey="stepsLoad" stackId="body" fill={BODY_STEPS} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection
        title={t("loadDetail.chartNeuroLoad")}
        legend={
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NEURO_SLEEP }} />
              {t("loadDetail.sleepDebt")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NEURO_STRESS }} />
              {t("loadDetail.stress")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NEURO_HRV }} />
              {t("loadDetail.hrv")}
            </span>
          </>
        }
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <ComposedChart data={chartData} margin={CHART_MARGIN} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" {...commonXAxisProps} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} {...commonYAxisProps} tickFormatter={(v) => `${v}%`} />
            <Bar dataKey="sleepDebtLoad" fill={NEURO_SLEEP} radius={[2, 2, 0, 0]} opacity={0.7} />
            <Line
              type="monotone"
              dataKey="stressLoad"
              stroke={NEURO_STRESS}
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="hrvLoad"
              stroke={NEURO_HRV}
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartSection>
    </section>
  );
}
