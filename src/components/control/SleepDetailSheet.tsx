import React from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import type { SleepEngineResult } from "@/engine/sleepEngine";
import { SleepCharts } from "@/components/control/SleepCharts";

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
  demoMode?: boolean;
  displayScore?: number;
}

export function SleepDetailSheet({
  open,
  onOpenChange,
  sleepDetail,
  nightsCount = 7,
  demoMode,
  displayScore = 98,
}: SleepDetailSheetProps) {
  const { t } = useTranslation();

  if (!sleepDetail) return null;

  const { sleepScore, weakestBlockKey } = sleepDetail;
  const showScore = demoMode ? displayScore : sleepScore;
  const aiSummaryKey = WEAKEST_SUMMARY[weakestBlockKey] ?? WEAKEST_SUMMARY.duration;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="flex h-[70vh] max-h-[70vh] flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <DrawerHeader className="shrink-0 border-b border-border px-4 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold text-foreground">
            {t("center.sleep")} — {showScore}%
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("sleepDetail.subtitle")}</p>
        </DrawerHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-6 pb-10"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* 1. ИТОГИ СНА */}
          <section className="pb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sleepDetail.resultsBlock")}
            </h3>
            <p className="text-sm text-foreground">{t(aiSummaryKey)}</p>
          </section>

          {/* 2. СТАТИСТИКА (графики) */}
          <SleepCharts sleepDetail={sleepDetail} nightsCount={nightsCount} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
