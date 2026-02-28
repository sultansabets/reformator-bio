import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { calculateLoadDetail, type LoadEngineResult, type LoadStatus } from "@/engine/loadEngine";
import { useHealthStore } from "@/store/healthStore";
import { LoadCharts } from "@/components/control/LoadCharts";
import { getMetricColor } from "@/lib/colors";

const STATUS_LABEL: Record<LoadStatus, string> = {
  balanced: "loadDetail.statusBalanced",
  overloaded: "loadDetail.statusOverloaded",
  low_activity: "loadDetail.statusLowActivity",
};

const RING_SIZE = 88;
const RING_STROKE = 4;

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
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="absolute inset-0">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold tabular-nums">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}

interface LoadDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadPercent: number;
}

export function LoadDetailSheet({ open, onOpenChange, loadPercent }: LoadDetailSheetProps) {
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
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold text-foreground">
            {t("loadDetail.title")}
          </h2>
        </DrawerHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* 1. СТАТУС НАГРУЗКИ */}
          <section className="pt-0 pb-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.statusTitle")}
            </h3>
            <div className="flex flex-col items-center gap-4">
              <LoadRing percent={totalLoad} color={loadColor} />
              <p className="text-sm font-medium text-foreground">
                {t(STATUS_LABEL[status])}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {t("loadDetail.statusDesc")}
              </p>
            </div>
          </section>

          {/* 2. ФИЗИЧЕСКАЯ НАГРУЗКА */}
          <section className="pb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.physicalTitle")}
            </h3>
            <div className="flex flex-col items-center gap-4">
              <LoadRing percent={bodyLoad} color={getMetricColor(bodyLoad, true)} />
              <ul className="w-full space-y-2 text-sm text-foreground">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">{t("loadDetail.strength")}</span>
                  <span className="font-medium tabular-nums">{strengthLoad}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">{t("loadDetail.cardio")}</span>
                  <span className="font-medium tabular-nums">{cardioLoad}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">{t("loadDetail.steps")}</span>
                  <span className="font-medium tabular-nums">{stepsLoad}%</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 3. НЕРВНАЯ СИСТЕМА */}
          <section className="pb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.neuroTitle")}
            </h3>
            <div className="flex flex-col items-center gap-4">
              <LoadRing percent={neuroLoad} color={getMetricColor(neuroLoad, true)} />
              <ul className="w-full space-y-2 text-sm text-foreground">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">{t("loadDetail.stress")}</span>
                  <span className="font-medium tabular-nums">{stressLoad}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">{t("loadDetail.sleepDebt")}</span>
                  <span className="font-medium tabular-nums">{sleepDebtLoad}%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">{t("loadDetail.hrv")}</span>
                  <span className="font-medium tabular-nums">{hrvLoad}%</span>
                </li>
              </ul>
            </div>
          </section>

          {/* 4. ТРЕНД ЗА 7 ДНЕЙ */}
          <LoadCharts loadDetail={detail} />

          {/* 5. РЕКОМЕНДАЦИИ */}
          <section className="pb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.recommendationTitle")}
            </h3>
            <p className="text-sm text-foreground">
              {t(recommendation)}
            </p>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
