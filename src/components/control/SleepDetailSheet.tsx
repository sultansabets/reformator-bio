import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import type { SleepEngineResult } from "@/engine/sleepEngine";
import { SleepCharts } from "@/components/control/SleepCharts";

const NIGHTS_FOR_TREND = 5;
const CHART_HEIGHT = 80;
const CHART_PADDING = { top: 8, right: 12, left: 12, bottom: 8 };
const LINE_STROKE_WIDTH = 1.5;
const GRID_STROKE = "rgba(255,255,255,0.12)";
const DEFAULT_FALL_ASLEEP = 22 * 60;

function buildDurationTrendData(
  actualMinutes: number,
  normMinutes: number,
  dayLabels: string[]
): { day: string; minutes: number; norm: number }[] {
  const labels = Array.isArray(dayLabels) && dayLabels.length >= 7 ? dayLabels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const base = Math.max(60, actualMinutes);
  const norm = Math.max(60, normMinutes);
  return labels.map((day, i) => {
    const isToday = i === todayIdx;
    const seed = (i * 31 + base) % 100;
    const factor = isToday ? 1 : 0.88 + (seed / 100) * 0.2;
    return { day, minutes: Math.round(base * factor), norm };
  });
}

function buildHrChartData(actualMinutes: number, baseHR: number): { minute: number; hr: number }[] {
  const total = Math.max(1, actualMinutes);
  const pts = Math.min(32, Math.max(12, Math.floor(total / 15)));
  const step = total / Math.max(1, pts - 1);
  const out: { minute: number; hr: number }[] = [];
  for (let i = 0; i < pts; i++) {
    const t = i * step;
    const x = t / total;
    const dip = Math.sin(Math.PI * x) * 8;
    out.push({ minute: t, hr: Math.round(baseHR + dip) });
  }
  return out;
}

function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
}

function formatTimeHHMM(minutesFromMidnight: number): string {
  const m = ((minutesFromMidnight % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const WEAKEST_SUMMARY: Record<string, string> = {
  duration: "sleepDetail.aiDuration",
  continuity: "sleepDetail.aiContinuity",
  deep: "sleepDetail.aiArchitecture",
  rem: "sleepDetail.aiArchitecture",
  hrv: "sleepDetail.aiHRV",
};

interface SleepDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sleepDetail: SleepEngineResult | null;
  /** Number of nights of sleep data available for trends. If &lt; 5, shows "not enough data" and muted graphs. */
  nightsCount?: number;
}

function MetricRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${className}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function SleepDetailSheet({
  open,
  onOpenChange,
  sleepDetail,
  nightsCount = 7,
}: SleepDetailSheetProps) {
  const { t } = useTranslation();
  const [phasesExpanded, setPhasesExpanded] = useState(false);
  const [durationExpanded, setDurationExpanded] = useState(false);

  const dayLabels = t("center.dayLabels", { returnObjects: true }) as string[];

  const durationTrendData = useMemo(() => {
    if (!sleepDetail?.displayData) return [];
    const { actualSleepMinutes, personalOptimalSleepMinutes } = sleepDetail.displayData;
    return buildDurationTrendData(actualSleepMinutes, personalOptimalSleepMinutes, dayLabels);
  }, [sleepDetail?.displayData, dayLabels]);

  const hrChartData = useMemo(() => {
    if (!sleepDetail?.displayData) return [];
    const { actualSleepMinutes, currentNightHR } = sleepDetail.displayData;
    return buildHrChartData(actualSleepMinutes, currentNightHR);
  }, [sleepDetail?.displayData]);

  const hasEnoughNights = nightsCount >= NIGHTS_FOR_TREND;

  if (!sleepDetail) return null;

  const { sleepScore, weakestBlockKey, displayData } = sleepDetail;
  const aiSummaryKey = WEAKEST_SUMMARY[weakestBlockKey] ?? WEAKEST_SUMMARY.duration;
  const actualMinutes = displayData.actualSleepMinutes;
  const normMinutes = displayData.personalOptimalSleepMinutes;
  const sleepEfficiency = Math.round(
    100 - (displayData.totalWakeMinutes / Math.max(1, actualMinutes + displayData.totalWakeMinutes)) * 100
  );
  const timeInBed = actualMinutes + displayData.totalWakeMinutes;

  const fallAsleepTime = formatTimeHHMM(DEFAULT_FALL_ASLEEP);
  const wakeUpTime = formatTimeHHMM(DEFAULT_FALL_ASLEEP + actualMinutes);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold text-foreground">
            {t("center.sleep")} — {sleepScore}%
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("sleepDetail.subtitle")}</p>
        </DrawerHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* ─── UNIFIED DASHBOARD ─── */}
          <div className="space-y-0 rounded-lg border border-border bg-card">
            {/* 1. ИТОГИ СНА */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.resultsBlock")}
              </h3>
              <p className="text-sm text-foreground">{t(aiSummaryKey)}</p>
            </section>

            {/* 2. КАЧЕСТВО СНА */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.qualityBlock")}
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50">
                  <span className="text-lg font-bold text-foreground">{sleepScore}%</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("sleepDetail.highRecovery")}</p>
              </div>
            </section>

            {/* 3. РЕГУЛЯРНОСТЬ */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.regularityBlock")}
              </h3>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">{t("sleepDetail.continuityAwakenings")}</span>
                <span className="text-sm font-medium tabular-nums text-foreground">{displayData.awakenings}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-sm text-muted-foreground">{t("sleepDetail.continuityWakeMinutes")}</span>
                <span className="text-sm font-medium tabular-nums text-foreground">{formatDurationShort(displayData.totalWakeMinutes)}</span>
              </div>
            </section>

            {/* 4. НАЧАЛО СНА */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.sleepStartBlock")}
              </h3>
              <MetricRow label={t("sleepDetail.fallAsleep")} value={fallAsleepTime} />
            </section>

            {/* 5. ПОДЪЁМ */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.wakeUpBlock")}
              </h3>
              <MetricRow label={t("sleepDetail.wakeUp")} value={wakeUpTime} />
            </section>

            {/* 6. ЭФФЕКТИВНОСТЬ */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.efficiencyBlock")}
              </h3>
              <MetricRow label={t("sleepDetail.sleepEfficiency")} value={`${sleepEfficiency}%`} />
            </section>

            {/* 7. ВРЕМЯ В ПОСТЕЛИ */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.timeInBedBlock")}
              </h3>
              <MetricRow label={t("sleepDetail.totalSleep")} value={formatDurationShort(timeInBed)} />
            </section>

            {/* 8. ВО СНЕ (фазы + пульс) */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.inSleepBlock")}
              </h3>
              {(() => {
                const total = actualMinutes && actualMinutes > 0 ? actualMinutes : 450;
                const awakenings = displayData.awakenings ?? 0;
                const awakeningMinutes = Array.from(
                  { length: awakenings },
                  (_, i) => Math.round(((i + 1) / (awakenings + 1)) * total)
                );
                const phaseColors: Record<string, string> = {
                  deep: "rgba(30,58,138,0.15)",
                  light: "rgba(59,130,246,0.15)",
                  rem: "rgba(124,58,237,0.15)",
                  awake: "rgba(239,68,68,0.2)",
                };
                const pts = hrChartData;
                const hrPath =
                  pts.length >= 2 && total > 0
                    ? pts
                        .map((p, i) => {
                          const x = (p.minute / total) * 100;
                          const y = Math.max(5, Math.min(95, 100 - (p.hr - 50) * 2.5));
                          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                        })
                        .join(" ")
                    : "";
                return (
                  <>
                    <div className="min-h-[100px] h-[100px] w-full overflow-x-auto">
                      <div className="relative h-full w-full" style={{ minWidth: total * 2 }}>
                        <div className="absolute inset-0 flex h-full gap-[1px]">
                          {Array.from({ length: total }).map((_, i) => {
                            const progress = i / total;
                            let phase: "deep" | "light" | "rem" | "awake" = "light";
                            if (progress < 0.15) phase = "light";
                            else if (progress < 0.35) phase = "deep";
                            else if (progress < 0.55) phase = "rem";
                            else if (progress < 0.8) phase = "light";
                            else phase = "awake";
                            return (
                              <div
                                key={i}
                                className="w-[2px] rounded-full shrink-0"
                                style={{ height: "100%", backgroundColor: phaseColors[phase] }}
                              />
                            );
                          })}
                        </div>
                        <svg
                          className="absolute inset-0 h-full w-full"
                          preserveAspectRatio="none"
                          viewBox="0 0 100 100"
                        >
                          {awakeningMinutes.map((min) => (
                            <line
                              key={min}
                              x1={(min / total) * 100}
                              y1={0}
                              x2={(min / total) * 100}
                              y2={100}
                              stroke="rgba(255,255,255,0.4)"
                              strokeWidth={0.5}
                              strokeDasharray="3 3"
                            />
                          ))}
                          {hrPath && (
                            <path
                              d={hrPath}
                              fill="none"
                              stroke="#9ED0FF"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                      <span>{fallAsleepTime}</span>
                      <span>{wakeUpTime}</span>
                    </div>
                  </>
                );
              })()}
              {phasesExpanded && (
                <div className="mt-3 space-y-1.5 rounded-lg bg-muted/30 px-3 py-2.5 text-sm">
                  <p className="text-foreground">
                    {t("sleepDetail.archDeep")}: {displayData.deepPercent.toFixed(1)}%
                  </p>
                  <p className="text-foreground">
                    {t("sleepDetail.archRem")}: {displayData.remPercent.toFixed(1)}%
                  </p>
                  <p className="text-foreground">
                    {t("sleepDetail.phaseLight")}: {(100 - displayData.deepPercent - displayData.remPercent).toFixed(1)}%
                  </p>
                  <p className="text-muted-foreground">
                    {t("sleepDetail.archLatency")}: {Math.round(displayData.sleepLatencyMinutes)} мин
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={() => setPhasesExpanded((v) => !v)}
                className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {phasesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {phasesExpanded ? t("sleepDetail.showLess") : t("sleepDetail.showMore")}
              </button>
            </section>

            {/* 9. ШУМ */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.noiseBlock")}
              </h3>
              <p className="py-2.5 text-sm text-muted-foreground">—</p>
            </section>

            {/* 10. ХРАП */}
            <section className="border-b border-border px-4 py-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.snoringBlock")}
              </h3>
              <p className="py-2.5 text-sm text-muted-foreground">—</p>
            </section>

            {/* ДЛИТЕЛЬНОСТЬ — ТРЕНД (если развёрнут) */}
            {durationExpanded && durationTrendData.length >= 2 && (
              <section className="border-t border-border px-4 py-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sleepDetail.howMuchYouSlept")} — {t("sleepDetail.yourNorm")}
                </h3>
                {!hasEnoughNights && (
                  <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    {t("sleepDetail.notEnoughData")}
                  </div>
                )}
                <div
                  className="h-[80px] w-full"
                  style={{ opacity: hasEnoughNights ? 1 : 0.5 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={durationTrendData} margin={CHART_PADDING}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                      <ReferenceLine y={normMinutes} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" strokeWidth={1} />
                      <XAxis dataKey="day" hide />
                      <YAxis domain={["dataMin - 30", "dataMax + 30"]} hide />
                      <Line
                        type="monotone"
                        dataKey="minutes"
                        stroke={hasEnoughNights ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)"}
                        strokeWidth={LINE_STROKE_WIDTH}
                        dot={false}
                        isAnimationActive
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <button
                  type="button"
                  onClick={() => setDurationExpanded(false)}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("sleepDetail.showLess")}
                </button>
              </section>
            )}

            {!durationExpanded && (
              <section className="border-t border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setDurationExpanded(true)}
                  className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="h-4 w-4" />
                  {t("sleepDetail.howMuchYouSlept")} — {formatDurationShort(actualMinutes)}
                </button>
              </section>
            )}
          </div>
          <SleepCharts sleepDetail={sleepDetail} nightsCount={nightsCount} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
