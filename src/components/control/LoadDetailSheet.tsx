import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { calculateLoadDetail, type LoadEngineResult, type LoadStatus } from "@/engine/loadEngine";
import { useHealthStore } from "@/store/healthStore";
import { LoadCharts } from "@/components/control/LoadCharts";

const STATUS_LABEL: Record<LoadStatus, string> = {
  balanced: "loadDetail.statusBalanced",
  overloaded: "loadDetail.statusOverloaded",
  low_activity: "loadDetail.statusLowActivity",
};

const STATUS_COLOR_HEX: Record<LoadStatus, string> = {
  balanced: "#37BE7E",
  overloaded: "#EF4444",
  low_activity: "#F59E0B",
};

const MAIN_RING_SIZE = 140;
const MAIN_RING_STROKE = 6;
const MINI_RING_SIZE = 64;
const MINI_RING_STROKE = 4;

interface RingProps {
  size: number;
  strokeWidth: number;
  percent: number;
  color: string;
}

function LoadRing({ size, strokeWidth, percent, color }: RingProps) {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{Math.round(clamped)}%</span>
      </div>
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

  const recommendation = status === "overloaded"
    ? "loadDetail.recOverloaded"
    : status === "low_activity"
      ? "loadDetail.recLowActivity"
      : "loadDetail.recBalanced";

  const bodyTotal = bodyLoad + neuroLoad || 1;
  const bodyPct = (bodyLoad / bodyTotal) * 100;
  const neuroPct = (neuroLoad / bodyTotal) * 100;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="flex max-h-[calc(100dvh-env(safe-area-inset-top))] flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
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
          <section className="px-4 py-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.statusTitle")}
            </h3>
            <div className="flex flex-col items-center gap-4">
              <LoadRing
                size={MAIN_RING_SIZE}
                strokeWidth={MAIN_RING_STROKE}
                percent={totalLoad}
                color={STATUS_COLOR_HEX[status]}
              />
              <p className="text-sm font-medium text-foreground">
                {t(STATUS_LABEL[status])}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {t("loadDetail.statusDesc")}
              </p>
            </div>
          </section>

          {/* 2. ОБЩИЙ ИНДЕКС — тело / нервная система */}
          <section className="px-4 py-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.breakdownTitle")}
            </h3>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full transition-all"
                style={{ width: `${bodyPct}%`, backgroundColor: "#3B82F6" }}
              />
              <div
                className="h-full transition-all"
                style={{ width: `${neuroPct}%`, backgroundColor: "rgba(239,68,68,0.85)" }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{t("loadDetail.body")} {bodyLoad}%</span>
              <span>{t("loadDetail.neuro")} {neuroLoad}%</span>
            </div>
          </section>

          {/* 3. ФИЗИЧЕСКАЯ НАГРУЗКА */}
          <section className="px-4 py-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.physicalTitle")}
            </h3>
            <div className="flex flex-col items-center gap-4">
              <LoadRing size={MINI_RING_SIZE} strokeWidth={MINI_RING_STROKE} percent={bodyLoad} color="#3B82F6" />
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

          {/* 4. НЕРВНАЯ СИСТЕМА */}
          <section className="px-4 py-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.neuroTitle")}
            </h3>
            <div className="flex flex-col items-center gap-4">
              <LoadRing size={MINI_RING_SIZE} strokeWidth={MINI_RING_STROKE} percent={neuroLoad} color="rgba(239,68,68,0.9)" />
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

          {/* 5. ТРЕНД ЗА 7 ДНЕЙ */}
          <LoadCharts loadDetail={detail} />

          {/* 6. РЕКОМЕНДАЦИИ */}
          <section className="px-4 py-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.recommendationTitle")}
            </h3>
            <p className="text-sm text-foreground">
              {t(recommendation)}
            </p>
          </section>

          {/* 7. ОБЪЯСНЕНИЕ РАСЧЁТА */}
          <section className="px-4 py-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("loadDetail.formulaTitle")}
            </h3>
            <div className="space-y-3 text-xs text-muted-foreground">
              <p><strong className="text-foreground">BodyLoad</strong> = 0.5×Силовые + 0.3×Кардио + 0.2×Шаги</p>
              <p><strong className="text-foreground">NeuroLoad</strong> = 0.5×Стресс + 0.3×Недосып + 0.2×HRV</p>
              <p><strong className="text-foreground">TotalLoad</strong> = 0.6×BodyLoad + 0.4×NeuroLoad</p>
            </div>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
