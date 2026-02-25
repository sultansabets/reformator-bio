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

const STATUS_COLOR_HEX: Record<LoadStatus, string> = {
  balanced: "#22C55E",
  overloaded: "#EF4444",
  low_activity: "#F59E0B",
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
            {t("loadDetail.title")}
          </h2>
        </DrawerHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="space-y-5">
            {/* Общая нагрузка: большой круг */}
            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Общая нагрузка
              </h3>
              <div className="flex items-center gap-4">
                {/* Основной круг */}
                <div className="flex flex-col items-center justify-center">
                  <div
                    className={[
                      "relative flex items-center justify-center rounded-full",
                      status === "low_activity" ? "h-[96px] w-[96px]" : "h-20 w-20",
                      status === "overloaded" ? "animate-pulse" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{
                      backgroundColor: STATUS_COLOR_HEX[status],
                      boxShadow:
                        status === "low_activity"
                          ? "0 0 30px rgba(245,158,11,0.35)"
                          : "none",
                    }}
                  >
                    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#020817] text-foreground">
                      <span className="text-2xl font-bold tabular-nums">
                        {totalLoad}%
                      </span>
                    </div>
                  </div>
                  <p
                    className={[
                      "mt-2 text-sm text-foreground",
                      status === "low_activity" ? "font-semibold" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {STATUS_LABEL[status]}
                  </p>
                </div>

                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Индекс рассчитывается на основе силовых, кардио, шагов, уровня стресса, сна и
                    пробуждений.
                  </p>
                  {status === "overloaded" && (
                    <p className="text-xs text-status-red font-medium">
                      Рекомендуется восстановление и снижение нагрузки.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Физическая и нейронная нагрузка: мини-круги + stacked bar */}
            <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <h3 className="mb-1 text-sm font-medium text-foreground">
                Физическая и нейронная нагрузка
              </h3>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center text-sm">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-border bg-background">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
                      <span className="text-lg font-semibold text-foreground">
                        {physicalScore}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground text-center max-w-[120px]">
                    Физическая нагрузка
                  </p>
                </div>

                <div className="flex flex-col items-center text-sm">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-border bg-background">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
                      <span className="text-lg font-semibold text-foreground">
                        {neuroScore}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground text-center max-w-[120px]">
                    Нервная система
                  </p>
                </div>
              </div>

              {/* Stacked bar: физическая vs нейронная */}
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Физическая</span>
                  <span>Нервная система</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  {physicalScore + neuroScore > 0 ? (
                    <div className="flex h-full w-full">
                      <div
                        className="h-full bg-[#3B82F6]"
                        style={{
                          width: `${(physicalScore / (physicalScore + neuroScore)) * 100}%`,
                        }}
                      />
                      <div
                        className="h-full bg-[#EF4444]"
                        style={{
                          width: `${(neuroScore / (physicalScore + neuroScore)) * 100}%`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-full w-1/2 bg-[#3B82F6]" />
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
