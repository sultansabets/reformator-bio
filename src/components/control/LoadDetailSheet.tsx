import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { calculateLoadDetail, type LoadStatus } from "@/engine/loadEngine";
import { useHealthStore } from "@/store/healthStore";

interface LoadDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadPercent: number;
}

const STATUS_LABEL: Record<LoadStatus, string> = {
  balanced: "В балансе",
  overloaded: "Перегружен",
  low_activity: "Мало активности",
};

const STATUS_COLOR_CLASS: Record<LoadStatus, string> = {
  balanced: "bg-status-green",
  overloaded: "bg-status-red",
  low_activity: "bg-status-amber",
};

export function LoadDetailSheet({ open, onOpenChange }: LoadDetailSheetProps) {
  const { t } = useTranslation();
  const workouts = useHealthStore((s) => s.workouts);
  const steps = useHealthStore((s) => s.steps);
  const stressPercent = useHealthStore((s) => s.stress);
  const sleepDetail = useHealthStore((s) => s.sleepDetail);

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
    return {
      strengthMinutes: strengthSec / 60,
      cardioMinutes: cardioSec / 60,
    };
  }, [workouts]);

  const detail = useMemo(() => {
    const totalSleepMinutes = sleepDetail?.displayData.actualSleepMinutes ?? 0;
    const awakenings = sleepDetail?.displayData.awakenings ?? 0;
    const stress0to10 = Math.max(0, Math.min(10, (stressPercent || 0) / 10));

    return calculateLoadDetail({
      strengthMinutes,
      cardioMinutes,
      steps,
      intensity: 1,
      stress: stress0to10,
      totalSleepMinutes,
      awakenings,
    });
  }, [strengthMinutes, cardioMinutes, steps, stressPercent, sleepDetail]);

  const { physicalScore, neuroScore, totalLoad, status } = detail;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold">
            {t("loadDetail.title")} — {totalLoad}%
          </h2>
        </DrawerHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Общая нагрузка
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {totalLoad}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Сводный индекс нагрузки за день
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${STATUS_COLOR_CLASS[status]}`}
                  />
                  <span className="text-xs font-medium text-foreground">
                    {STATUS_LABEL[status]}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <h3 className="mb-1 text-sm font-medium text-foreground">
                Физическая и нейронная нагрузка
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Физическая нагрузка
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {physicalScore}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Силовые, кардио и шаги
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Нагрузка на нервную систему
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {neuroScore}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Стресс, сон и пробуждения
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
