import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import type { SleepEngineResult, SleepBlock } from "@/engine/sleepEngine";

const PHASE_DEEP = 3;
const PHASE_REM = 2;
const PHASE_LIGHT = 1;
const PHASE_WAKE = 0;

const PHASE_COLORS: Record<number, string> = {
  [PHASE_DEEP]: "hsl(222 47% 25%)",
  [PHASE_REM]: "hsl(263 70% 45%)",
  [PHASE_LIGHT]: "hsl(199 89% 48%)",
  [PHASE_WAKE]: "hsl(0 0% 65%)",
};

function buildPhaseChartData(actualMinutes: number, deepPct: number, remPct: number): { time: number; phase: number }[] {
  const total = Math.max(60, actualMinutes);
  const deepMin = Math.round((deepPct / 100) * total);
  const remMin = Math.round((remPct / 100) * total);
  const lightMin = Math.max(0, total - deepMin - remMin);

  const out: { time: number; phase: number }[] = [];
  let t = 0;
  const addSegment = (duration: number, phase: number) => {
    if (duration > 0) {
      out.push({ time: t, phase }, { time: t + duration, phase });
      t += duration;
    }
  };
  addSegment(lightMin, PHASE_LIGHT);
  addSegment(deepMin, PHASE_DEEP);
  addSegment(remMin, PHASE_REM);
  if (out.length === 0) out.push({ time: 0, phase: PHASE_LIGHT }, { time: total, phase: PHASE_LIGHT });
  return out;
}

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

function BlockRow({
  block,
  expanded,
  onOpenChange,
  children,
}: {
  block: SleepBlock;
  expanded: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const weightPct = Math.round(block.weight * 100);

  return (
    <Collapsible open={expanded} onOpenChange={onOpenChange}>
      <div className="rounded-xl border border-border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
          <div>
            <p className="font-medium text-foreground">{t(block.labelKey)} ({weightPct}%)</p>
            <p className="text-sm text-muted-foreground">
              {Math.round(block.score)}%
            </p>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return min > 0 ? `${h} ч ${min} мин` : `${h} ч`;
}

export function SleepDetailSheet({
  open,
  onOpenChange,
  sleepDetail,
}: SleepDetailSheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    duration: false,
    continuity: false,
    hr: false,
    hrv: false,
    architecture: false,
  });

  const phaseData = useMemo(() => {
    if (!sleepDetail?.displayData) return [];
    const { actualSleepMinutes, deepPercent, remPercent } = sleepDetail.displayData;
    return buildPhaseChartData(actualSleepMinutes, deepPercent, remPercent);
  }, [sleepDetail?.displayData]);

  if (!sleepDetail) return null;

  const { sleepScore, blocks, weakestBlockKey, displayData } = sleepDetail;
  const aiSummaryKey = WEAKEST_SUMMARY[weakestBlockKey] ?? WEAKEST_SUMMARY.duration;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold">
            {t("center.sleep")} — {sleepScore}%
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sleepDetail.subtitle")}
          </p>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="space-y-3">
            {blocks.map((block) => (
              <BlockRow
                key={block.key}
                block={block}
                expanded={!!expanded[block.key]}
                onOpenChange={(open) => setExpanded((prev) => ({ ...prev, [block.key]: open }))}
              >
                <div className="border-t px-4 pb-4 pt-3">
                  {block.key === "duration" && (
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>{t("sleepDetail.durationActual")}: {formatMinutes(displayData.actualSleepMinutes)}</li>
                      <li>{t("sleepDetail.durationNorm")}: {formatMinutes(displayData.personalOptimalSleepMinutes)}</li>
                      <li>{t("sleepDetail.durationDebt")}: {formatMinutes(displayData.sleepDebtMinutes)}</li>
                    </ul>
                  )}
                  {block.key === "continuity" && (
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>{t("sleepDetail.continuityAwakenings")}: {displayData.awakenings}</li>
                      <li>{t("sleepDetail.continuityWakeMinutes")}: {Math.round(displayData.totalWakeMinutes)} мин</li>
                    </ul>
                  )}
                  {block.key === "hr" && (
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>{t("sleepDetail.hrCurrent")}: {Math.round(displayData.currentNightHR)} уд/мин</li>
                      <li>{t("sleepDetail.hrBaseline")}: {Math.round(displayData.baselineNightHR)} уд/мин</li>
                      <li>{t("sleepDetail.hrDiff")}: {Math.round(displayData.currentNightHR - displayData.baselineNightHR)} уд/мин</li>
                    </ul>
                  )}
                  {block.key === "hrv" && (
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>{t("sleepDetail.hrvCurrent")}: {Math.round(displayData.currentNightHRV)} мс</li>
                      <li>{t("sleepDetail.hrvBaseline")}: {Math.round(displayData.baselineHRV)} мс</li>
                      <li>{t("sleepDetail.hrvTrend")}: {displayData.currentNightHRV >= displayData.baselineHRV ? t("sleepDetail.trendUp") : t("sleepDetail.trendDown")}</li>
                    </ul>
                  )}
                  {block.key === "architecture" && (
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li>{t("sleepDetail.archDeep")}: {displayData.deepPercent.toFixed(1)}%</li>
                      <li>{t("sleepDetail.archRem")}: {displayData.remPercent.toFixed(1)}%</li>
                      <li>{t("sleepDetail.archLatency")}: {Math.round(displayData.sleepLatencyMinutes)} мин</li>
                    </ul>
                  )}
                </div>
              </BlockRow>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sleepDetail.phasesChart")}
            </h3>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={phaseData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                  <defs>
                    <linearGradient id="phaseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PHASE_COLORS[PHASE_DEEP]} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={PHASE_COLORS[PHASE_DEEP]} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={[0, "dataMax"]}
                    tickFormatter={(v) => `${Math.round(v / 60)}ч`}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 3.5]}
                    ticks={[0, 1, 2, 3]}
                    tickFormatter={(v) => (v === 0 ? t("sleepDetail.phaseWake") : v === 1 ? t("sleepDetail.phaseLight") : v === 2 ? t("sleepDetail.phaseRem") : t("sleepDetail.phaseDeep"))}
                    tick={{ fontSize: 9 }}
                    width={36}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Area
                    type="stepAfter"
                    dataKey="phase"
                    stroke={PHASE_COLORS[PHASE_DEEP]}
                    fill="url(#phaseGrad)"
                    strokeWidth={1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sleepDetail.aiSummary")}
            </p>
            <p className="mt-2 text-sm text-foreground">{t(aiSummaryKey)}</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
