import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { calculateLoadDetail, type LoadStatus } from "@/engine/loadEngine";
import { useHealthStore } from "@/store/healthStore";
import { LoadCharts } from "@/components/control/LoadCharts";
import { getMetricColor } from "@/lib/colors";

const STATUS_LABEL: Record<LoadStatus, string> = {
  balanced: "loadDetail.statusBalanced",
  overloaded: "loadDetail.statusOverloaded",
  low_activity: "loadDetail.statusLowActivity",
};

const RING_SIZE = 100;
const RING_STROKE = 3;

interface RingProps {
  percent: number;
  color: string;
}

function LoadRing({ percent, color }: RingProps) {
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

interface LoadBarProps {
  percent: number;
  color: string;
}

function LoadBar({ percent, color }: LoadBarProps) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-lg bg-white/10">
      <motion.div
        className="h-full rounded-lg"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, percent)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

interface LoadDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadPercent: number;
}

export function LoadDetailSheet({ open, onOpenChange }: LoadDetailSheetProps) {
  const { t } = useTranslation();
  const workouts = useHealthStore((s) => s.workouts);
  const steps = useHealthStore((s) => s.steps);
  const stressPercent = useHealthStore((s) => s.stress);
  const sleepDetail = useHealthStore((s) => s.sleepDetail);
  const hrv = useHealthStore((s) => s.hrv);

  const { strengthMinutes, cardioMinutes } = useMemo(() => {
    let strengthSec = 0;
    let cardioSec = 0;
    workouts.forEach((w) => {
      const sec = w.durationSec || 0;
      const type = (w.type || "").toLowerCase();
      if (type.includes("сил") || type.includes("strength") || type.includes("gym")) {
        strengthSec += sec;
      } else {
        cardioSec += sec;
      }
    });
    return { strengthMinutes: strengthSec / 60, cardioMinutes: cardioSec / 60 };
  }, [workouts]);

  const detail = useMemo(() => {
    const totalSleepMinutes = sleepDetail?.displayData?.actualSleepMinutes ?? 7.5 * 60;
    const stress0to100 = Math.max(0, Math.min(100, (stressPercent ?? 0) * 10));
    return calculateLoadDetail({
      strengthMinutes,
      cardioMinutes,
      cardioZone: 2,
      steps: steps ?? 0,
      stress: stress0to100,
      totalSleepMinutes,
      hrv: hrv ?? 45,
      hrvNorm: 50,
    });
  }, [strengthMinutes, cardioMinutes, steps, stressPercent, sleepDetail, hrv]);

  const { totalLoad, bodyLoad, neuroLoad, strengthLoad, cardioLoad, stepsLoad, stressLoad, sleepDebtLoad, hrvLoad, status } = detail;

  const loadColor = getMetricColor(totalLoad, true);
  const bodyLoadColor = getMetricColor(bodyLoad, true);
  const neuroLoadColor = getMetricColor(neuroLoad, true);

  const recommendation = status === "overloaded"
    ? "loadDetail.recOverloaded"
    : status === "low_activity"
      ? "loadDetail.recLowActivity"
      : "loadDetail.recBalanced";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="flex h-[70vh] max-h-[70vh] flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <DrawerHeader className="shrink-0 border-b border-border px-6 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold text-foreground">
            {t("loadDetail.title")} — {totalLoad}%
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(STATUS_LABEL[status])}
          </p>
        </DrawerHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pt-5 pb-10"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-8">
            {/* 1. Общая нагрузка */}
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("loadDetail.statusTitle")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold tabular-nums">{totalLoad}%</span>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: loadColor }}
                  >
                    {t(STATUS_LABEL[status])}
                  </span>
                </div>
                <LoadBar percent={totalLoad} color={loadColor} />
                <p className="text-xs text-muted-foreground">
                  {t("loadDetail.statusDesc")}
                </p>
              </div>
            </section>

            {/* 2. Физическая нагрузка */}
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("loadDetail.physicalTitle")}
              </h3>
              <div className="flex items-center gap-6">
                <LoadRing percent={bodyLoad} color={bodyLoadColor} />
                <div className="flex-1 space-y-1">
                  <MetricRow 
                    label={t("loadDetail.strength")} 
                    value={`${strengthLoad}%`} 
                  />
                  <MetricRow 
                    label={t("loadDetail.cardio")} 
                    value={`${cardioLoad}%`} 
                  />
                  <MetricRow 
                    label={t("loadDetail.steps")} 
                    value={`${stepsLoad}%`} 
                  />
                </div>
              </div>
            </section>

            {/* 3. Нервная система */}
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("loadDetail.neuroTitle")}
              </h3>
              <div className="flex items-center gap-6">
                <LoadRing percent={neuroLoad} color={neuroLoadColor} />
                <div className="flex-1 space-y-1">
                  <MetricRow 
                    label={t("loadDetail.stress")} 
                    value={`${stressLoad}%`} 
                  />
                  <MetricRow 
                    label={t("loadDetail.sleepDebt")} 
                    value={`${sleepDebtLoad}%`} 
                  />
                  <MetricRow 
                    label={t("loadDetail.hrv")} 
                    value={`${hrvLoad}%`} 
                  />
                </div>
              </div>
            </section>

            {/* 4. Тренд за 7 дней */}
            <LoadCharts loadDetail={detail} />

            {/* 5. Рекомендации */}
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("loadDetail.recommendationTitle")}
              </h3>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {t(recommendation)}
                </p>
              </div>
            </section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
