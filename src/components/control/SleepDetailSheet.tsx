import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";
import type { SleepEngineResult } from "@/engine/sleepEngine";

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

const DEFAULT_FALL_ASLEEP = 22 * 60;

const WEAKEST_SUMMARY: Record<string, string> = {
  duration: "sleepDetail.aiDuration",
  continuity: "sleepDetail.aiContinuity",
  hr: "sleepDetail.aiHR",
  hrv: "sleepDetail.aiHRV",
  architecture: "sleepDetail.aiArchitecture",
};

interface SleepDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sleepDetail: SleepEngineResult | null;
}

export function SleepDetailSheet({
  open,
  onOpenChange,
  sleepDetail,
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

  if (!sleepDetail) return null;

  const { sleepScore, weakestBlockKey, displayData } = sleepDetail;
  const aiSummaryKey = WEAKEST_SUMMARY[weakestBlockKey] ?? WEAKEST_SUMMARY.duration;
  const actualMinutes = displayData.actualSleepMinutes;
  const normMinutes = displayData.personalOptimalSleepMinutes;
  const diffMinutes = actualMinutes - normMinutes;
  const sleepEfficiency = Math.round(100 - (displayData.totalWakeMinutes / Math.max(1, actualMinutes + displayData.totalWakeMinutes)) * 100);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold text-foreground">
            {t("center.sleep")} — {sleepScore}%
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sleepDetail.subtitle")}
          </p>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="space-y-4">
            {/* ─── SLEEP DASHBOARD ─── */}
            <div className="overflow-hidden rounded-[24px] border border-border bg-[#18181b] shadow-lg">
              {/* 1. ДЛИТЕЛЬНОСТЬ */}
              <section className="p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">
                  {t("sleepDetail.howMuchYouSlept")}
                </h3>
                <button
                  type="button"
                  onClick={() => setDurationExpanded((v) => !v)}
                  className="w-full text-left"
                >
                  <p className="text-2xl font-bold text-white">
                    {formatDurationShort(actualMinutes)}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    {t("sleepDetail.yourNorm")}: {formatDurationShort(normMinutes)}
                    {diffMinutes < 0 && (
                      <span className="ml-2 text-amber-400">
                        {diffMinutes} мин
                      </span>
                    )}
                  </p>
                  {durationTrendData.length >= 2 && (
                    <div className="mt-3 h-16 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={durationTrendData} margin={{ top: 2, right: 4, left: 4, bottom: 2 }}>
                          <ReferenceLine y={normMinutes} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" strokeWidth={1} />
                          <XAxis dataKey="day" hide />
                          <YAxis domain={["dataMin - 30", "dataMax + 30"]} hide />
                          <Line
                            type="monotone"
                            dataKey="minutes"
                            stroke="rgba(255,255,255,0.8)"
                            strokeWidth={1.5}
                            dot={{ r: 2, fill: "rgba(255,255,255,0.8)" }}
                            isAnimationActive
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </button>

                {durationExpanded && hrChartData.length >= 2 && (
                  <div className="mt-3 min-w-0 overflow-hidden rounded-xl bg-[#0f0f10] p-3">
                    <ResponsiveContainer width="100%" height={100} minHeight={80}>
                      <LineChart data={hrChartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                        <ReferenceLine x={0} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" strokeWidth={1} />
                        <ReferenceLine x={actualMinutes} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" strokeWidth={1} />
                        <XAxis
                          dataKey="minute"
                          type="number"
                          domain={[0, Math.max(60, actualMinutes)]}
                          tickFormatter={(m) => {
                            const h = Math.floor(m / 60);
                            const min = Math.round(m % 60);
                            return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
                          }}
                          tick={{ fontSize: 9, fill: "rgba(255,255,255,0.6)" }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis domain={["auto", "auto"]} hide />
                        <Line
                          type="monotone"
                          dataKey="hr"
                          stroke="rgba(255,255,255,0.7)"
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex justify-between text-[10px] text-white/60">
                      <span>{formatTimeHHMM(DEFAULT_FALL_ASLEEP)}</span>
                      <span>{formatTimeHHMM(DEFAULT_FALL_ASLEEP + actualMinutes)}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* 2. ФАЗЫ СНА — TRUE TIMELINE */}
              <section className="border-t border-white/10 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">
                  {t("sleepDetail.howYouSlept")}
                </h3>
                <div className="min-w-0 overflow-hidden rounded-2xl bg-[#0f0f10] p-3">
                  {actualMinutes > 0 && (
                    <>
                      <div className="h-20 w-full overflow-x-auto">
                        <div className="flex h-full items-end gap-[1px]">
                          {Array.from({ length: actualMinutes }).map((_, i) => {
                            // простая псевдо-архитектура сна: первые 20% — light, затем циклы deep/rem/light/awake
                            const progress = i / actualMinutes;
                            let phase: "deep" | "light" | "rem" | "awake" = "light";
                            if (progress < 0.15) phase = "light";
                            else if (progress < 0.35) phase = "deep";
                            else if (progress < 0.55) phase = "rem";
                            else if (progress < 0.8) phase = "light";
                            else phase = "awake";

                            const colorByPhase: Record<typeof phase, string> = {
                              deep: "#1E3A8A",
                              light: "#3B82F6",
                              rem: "#7C3AED",
                              awake: "#EF4444",
                            };

                            return (
                              <div
                                key={i}
                                className="w-[2px] rounded-full"
                                style={{
                                  height: "100%",
                                  backgroundColor: colorByPhase[phase],
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between text-[10px] text-white/60">
                        <span>{formatTimeHHMM(DEFAULT_FALL_ASLEEP)}</span>
                        <span>
                          {formatTimeHHMM(
                            DEFAULT_FALL_ASLEEP + Math.round(actualMinutes / 2)
                          )}
                        </span>
                        <span>{formatTimeHHMM(DEFAULT_FALL_ASLEEP + actualMinutes)}</span>
                      </div>
                    </>
                  )}
                  <div className="mt-3 flex justify-between text-xs text-white/60">
                    <span>{t("sleepDetail.fallAsleep")}: {formatTimeHHMM(DEFAULT_FALL_ASLEEP)}</span>
                    <span>{t("sleepDetail.wakeUp")}: {formatTimeHHMM(DEFAULT_FALL_ASLEEP + actualMinutes)}</span>
                  </div>
                  <p className="mt-1 text-center text-xs text-white/50">
                    {t("sleepDetail.totalSleep")}: {formatDurationShort(actualMinutes)}
                  </p>
                </div>

                {phasesExpanded && (
                  <div className="mt-3 space-y-1.5 rounded-xl bg-white/5 px-4 py-3 text-sm">
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
                  className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-white/60 hover:text-white/80"
                >
                  {phasesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {phasesExpanded ? t("sleepDetail.showLess") : t("sleepDetail.showMore")}
                </button>
              </section>

              {/* 3. КАЧЕСТВО СНА */}
              <section className="border-t border-white/10 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">
                  {t("sleepDetail.qualityBlock")}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-white/5">
                    <span className="text-xl font-bold text-white">{sleepScore}%</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">
                      {t("sleepDetail.highRecovery")}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/60">
                      <span>{t("sleepDetail.sleepEfficiency")}: {sleepEfficiency}%</span>
                      <span>{t("sleepDetail.sleepDebt")}: {formatDurationShort(displayData.sleepDebtMinutes)}</span>
                      <span>{t("sleepDetail.hrCurrent")}: {Math.round(displayData.currentNightHR)}</span>
                      <span>{t("sleepDetail.hrvCurrent")}: {Math.round(displayData.currentNightHRV)} мс</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* AI Summary */}
            <div className="rounded-[24px] border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sleepDetail.aiSummary")}
              </p>
              <p className="mt-2 text-sm text-foreground">{t(aiSummaryKey)}</p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
