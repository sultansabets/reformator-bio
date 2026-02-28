import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { SleepEngineResult } from "@/engine/sleepEngine";

const PHASE_COLORS = {
  deep: "#6366F1",
  light: "#A5B4FC",
  rem: "#F472B6",
  awake: "#94A3B8",
};

function formatHoursMinutes(minutes: number): string {
  const roundedMinutes = Math.round(minutes / 5) * 5;
  const h = Math.floor(roundedMinutes / 60);
  const m = roundedMinutes % 60;
  if (h === 0) return `${m}м`;
  if (m === 0) return `${h}ч`;
  return `${h}ч ${m}м`;
}

function formatTime(minutes: number): string {
  const roundedMinutes = Math.round(minutes / 5) * 5;
  const total = ((roundedMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const RING_SIZE = 100;
const RING_STROKE = 6;

interface QualityRingProps {
  percent: number;
  color: string;
}

function QualityRing({ percent, color }: QualityRingProps) {
  const center = RING_SIZE / 2;
  const radius = center - RING_STROKE / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={RING_STROKE}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}

interface SleepPhasesTimelineProps {
  deepPercent: number;
  remPercent: number;
  lightPercent: number;
  awakePercent: number;
}

function SleepPhasesTimeline({ deepPercent, remPercent, lightPercent, awakePercent }: SleepPhasesTimelineProps) {
  const { t } = useTranslation();
  
  const phases = [
    { key: "deep", percent: deepPercent, color: PHASE_COLORS.deep, label: t("sleepDetail.phaseDeep") },
    { key: "light", percent: lightPercent, color: PHASE_COLORS.light, label: t("sleepDetail.phaseLight") },
    { key: "rem", percent: remPercent, color: PHASE_COLORS.rem, label: t("sleepDetail.phaseRem") },
    { key: "awake", percent: awakePercent, color: PHASE_COLORS.awake, label: t("sleepDetail.phaseAwake") },
  ];

  return (
    <div className="space-y-4">
      <div className="h-4 w-full overflow-hidden rounded-lg bg-white/5 flex">
        {phases.map((phase, index) => (
          <motion.div
            key={phase.key}
            className="h-full"
            style={{ backgroundColor: phase.color }}
            initial={{ width: 0 }}
            animate={{ width: `${phase.percent}%` }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {phases.map((phase) => (
          <div key={phase.key} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-sm shrink-0" 
              style={{ backgroundColor: phase.color }}
            />
            <span className="text-sm text-muted-foreground">{phase.label}</span>
            <span className="ml-auto text-sm font-medium tabular-nums">{Math.round(phase.percent)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SleepStructureChartProps {
  deepPercent: number;
  remPercent: number;
  lightPercent: number;
  awakePercent: number;
  totalMinutes: number;
}

function SleepStructureChart({ deepPercent, remPercent, lightPercent, awakePercent, totalMinutes }: SleepStructureChartProps) {
  const { t } = useTranslation();

  const sleepCycles = useMemo(() => {
    const cycles: { type: "deep" | "light" | "rem" | "awake"; duration: number }[] = [];
    const numCycles = Math.max(3, Math.min(6, Math.round(totalMinutes / 90)));
    
    const deepTotal = (deepPercent / 100) * totalMinutes;
    const remTotal = (remPercent / 100) * totalMinutes;
    const lightTotal = (lightPercent / 100) * totalMinutes;
    const awakeTotal = (awakePercent / 100) * totalMinutes;
    
    let deepRemaining = deepTotal;
    let remRemaining = remTotal;
    let lightRemaining = lightTotal;
    let awakeRemaining = awakeTotal;
    
    for (let i = 0; i < numCycles; i++) {
      const isFirstHalf = i < numCycles / 2;
      const cycleWeight = 1 / numCycles;
      
      const lightDur = Math.round(lightRemaining * cycleWeight * (isFirstHalf ? 0.8 : 1.2));
      if (lightDur > 0) {
        cycles.push({ type: "light", duration: lightDur });
        lightRemaining -= lightDur;
      }
      
      const deepDur = Math.round(deepRemaining * cycleWeight * (isFirstHalf ? 1.5 : 0.5));
      if (deepDur > 0) {
        cycles.push({ type: "deep", duration: deepDur });
        deepRemaining -= deepDur;
      }
      
      const lightDur2 = Math.round(lightRemaining * cycleWeight * 0.5);
      if (lightDur2 > 0) {
        cycles.push({ type: "light", duration: lightDur2 });
        lightRemaining -= lightDur2;
      }
      
      const remDur = Math.round(remRemaining * cycleWeight * (isFirstHalf ? 0.6 : 1.4));
      if (remDur > 0) {
        cycles.push({ type: "rem", duration: remDur });
        remRemaining -= remDur;
      }
      
      if (awakeRemaining > 5 && i < numCycles - 1 && Math.random() > 0.5) {
        const awakeDur = Math.min(5, Math.round(awakeRemaining * 0.3));
        if (awakeDur > 0) {
          cycles.push({ type: "awake", duration: awakeDur });
          awakeRemaining -= awakeDur;
        }
      }
    }
    
    if (lightRemaining > 0) cycles.push({ type: "light", duration: Math.round(lightRemaining) });
    if (deepRemaining > 0) cycles.push({ type: "deep", duration: Math.round(deepRemaining) });
    if (remRemaining > 0) cycles.push({ type: "rem", duration: Math.round(remRemaining) });
    if (awakeRemaining > 0) cycles.push({ type: "awake", duration: Math.round(awakeRemaining) });
    
    return cycles.filter(c => c.duration > 0);
  }, [deepPercent, remPercent, lightPercent, awakePercent, totalMinutes]);

  if (sleepCycles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("sleepDetail.noData")}
      </p>
    );
  }

  const legend = [
    { key: "deep", color: PHASE_COLORS.deep, label: t("sleepDetail.phaseDeep") },
    { key: "light", color: PHASE_COLORS.light, label: t("sleepDetail.phaseLight") },
    { key: "rem", color: PHASE_COLORS.rem, label: t("sleepDetail.phaseRem") },
    { key: "awake", color: PHASE_COLORS.awake, label: t("sleepDetail.phaseAwake") },
  ];

  return (
    <div className="space-y-4">
      <div className="h-6 w-full overflow-hidden rounded-lg flex">
        {sleepCycles.map((cycle, index) => (
          <motion.div
            key={`${cycle.type}-${index}`}
            className="h-full"
            style={{ 
              backgroundColor: PHASE_COLORS[cycle.type],
              flex: cycle.duration,
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.4, delay: index * 0.03, ease: "easeOut" }}
          />
        ))}
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>22:00</span>
        <span>02:00</span>
        <span>06:00</span>
      </div>

      <div className="flex flex-wrap gap-4">
        {legend.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <div 
              className="h-2.5 w-2.5 rounded-sm shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DurationBarProps {
  actualMinutes: number;
  targetMinutes: number;
}

function DurationBar({ actualMinutes, targetMinutes }: DurationBarProps) {
  const percent = Math.min(100, (actualMinutes / targetMinutes) * 100);
  const isDeficit = actualMinutes < targetMinutes;
  const color = isDeficit ? "#F59E0B" : "#37BE7E";

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold tabular-nums">{formatHoursMinutes(actualMinutes)}</span>
          <span className="ml-2 text-sm text-muted-foreground">/ {formatHoursMinutes(targetMinutes)}</span>
        </div>
        <span 
          className="text-sm font-medium"
          style={{ color }}
        >
          {isDeficit ? `−${formatHoursMinutes(targetMinutes - actualMinutes)}` : "✓"}
        </span>
      </div>
      
      <div className="h-3 w-full overflow-hidden rounded-lg bg-white/10">
        <motion.div
          className="h-full rounded-lg"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  subValue?: string;
}

function MetricRow({ label, value, subValue }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium tabular-nums">{value}</span>
        {subValue && (
          <span className="ml-1 text-xs text-muted-foreground">{subValue}</span>
        )}
      </div>
    </div>
  );
}

export interface SleepChartsProps {
  sleepDetail: SleepEngineResult | null;
  nightsCount?: number;
  selectedDate?: string;
}

export function SleepCharts({ sleepDetail, nightsCount = 7 }: SleepChartsProps) {
  const { t } = useTranslation();
  const hasEnoughNights = nightsCount >= 5;

  const displayData = useMemo(() => {
    if (!sleepDetail?.displayData) return null;
    const d = sleepDetail.displayData;
    
    const totalSleepTime = d.actualSleepMinutes + d.totalWakeMinutes;
    const lightPercent = Math.max(0, 100 - d.deepPercent - d.remPercent - (d.totalWakeMinutes / Math.max(1, totalSleepTime) * 100));
    const awakePercent = (d.totalWakeMinutes / Math.max(1, totalSleepTime)) * 100;
    
    return {
      actualMinutes: d.actualSleepMinutes,
      targetMinutes: d.personalOptimalSleepMinutes,
      deepPercent: d.deepPercent,
      remPercent: d.remPercent,
      lightPercent: Math.max(0, lightPercent),
      awakePercent: Math.min(20, awakePercent),
      sleepLatency: d.sleepLatencyMinutes,
      awakenings: d.awakenings,
      totalWakeMinutes: d.totalWakeMinutes,
      heartRate: d.currentNightHR,
      hrv: d.currentNightHRV,
      sleepDebt: d.sleepDebtMinutes,
    };
  }, [sleepDetail]);

  if (!sleepDetail || !displayData) return null;

  const qualityColor = sleepDetail.sleepScore >= 80 
    ? "#37BE7E" 
    : sleepDetail.sleepScore >= 60 
      ? "#F59E0B" 
      : "#EF4444";

  return (
    <div className="space-y-8">
      {/* 1. Sleep Duration */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sleepDetail.durationTitle")}
        </h3>
        <DurationBar 
          actualMinutes={displayData.actualMinutes} 
          targetMinutes={displayData.targetMinutes} 
        />
      </section>

      {/* 2. Sleep Quality */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sleepDetail.qualityTitle")}
        </h3>
        <div className="flex items-center gap-6">
          <QualityRing percent={sleepDetail.sleepScore} color={qualityColor} />
          <div className="flex-1 space-y-1">
            <MetricRow 
              label={t("sleepDetail.efficiency")} 
              value={`${Math.round(100 - (displayData.totalWakeMinutes / Math.max(1, displayData.actualMinutes + displayData.totalWakeMinutes)) * 100)}%`} 
            />
            <MetricRow 
              label={t("sleepDetail.latency")} 
              value={formatHoursMinutes(displayData.sleepLatency)} 
            />
            <MetricRow 
              label={t("sleepDetail.awakenings")} 
              value={`${displayData.awakenings}×`} 
            />
          </div>
        </div>
      </section>

      {/* 3. Sleep Phases */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sleepDetail.phasesTitle")}
        </h3>
        <SleepPhasesTimeline 
          deepPercent={displayData.deepPercent}
          remPercent={displayData.remPercent}
          lightPercent={displayData.lightPercent}
          awakePercent={displayData.awakePercent}
        />
      </section>

      {/* 4. Sleep Structure Chart */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sleepDetail.structureTitle")}
        </h3>
        <SleepStructureChart
          deepPercent={displayData.deepPercent}
          remPercent={displayData.remPercent}
          lightPercent={displayData.lightPercent}
          awakePercent={displayData.awakePercent}
          totalMinutes={displayData.actualMinutes}
        />
      </section>

      {/* 5. Recovery Metrics */}
      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("sleepDetail.recoveryTitle")}
        </h3>
        <div className="rounded-2xl bg-white/5 p-4 space-y-1">
          <MetricRow 
            label={t("sleepDetail.avgHeartRate")} 
            value={`${displayData.heartRate}`} 
            subValue={t("sleepDetail.bpm")}
          />
          <MetricRow 
            label={t("sleepDetail.hrvLabel")} 
            value={`${displayData.hrv}`} 
            subValue="ms"
          />
          {displayData.sleepDebt > 0 && (
            <MetricRow 
              label={t("sleepDetail.sleepDebtLabel")} 
              value={formatHoursMinutes(displayData.sleepDebt)} 
            />
          )}
        </div>
      </section>

      {!hasEnoughNights && (
        <p className="text-center text-xs text-muted-foreground py-4">
          {t("sleepDetail.notEnoughDataForTrends")}
        </p>
      )}
    </div>
  );
}
