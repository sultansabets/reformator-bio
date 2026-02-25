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
  balanced: "#37BE7E",
  overloaded: "#EF4444",
  low_activity: "#F59E0B",
};

const MAIN_RING_SIZE = 120;
const MAIN_RING_STROKE = 6;
const MINI_RING_SIZE = 70;
const MINI_RING_STROKE = 4;

interface RingProps {
  size: number;
  strokeWidth: number;
  percent: number;
  color: string;
}

const LoadRing: React.FC<RingProps> = ({ size, strokeWidth, percent, color }) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
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
        <span className="text-xl font-semibold tabular-nums">
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  );
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
            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Общая нагрузка
              </h3>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    filter: `drop-shadow(0 0 18px ${STATUS_COLOR_HEX[status]}40)`,
                  }}
                >
                  <LoadRing
                    size={MAIN_RING_SIZE}
                    strokeWidth={MAIN_RING_STROKE}
                    percent={totalLoad}
                    color={STATUS_COLOR_HEX[status]}
                  />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {STATUS_LABEL[status]}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Интегральная дневная нагрузка по тренировкам, шагам, стрессу и сну.
                </p>
              </div>

              <div className="mt-4 space-y-3 w-full">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Физическая</span>
                  <span>Нервная система</span>
                </div>
                <div className="h-[6px] w-full overflow-hidden rounded-full bg-muted">
                  {physicalScore + neuroScore > 0 ? (
                    <div className="flex h-full w-full">
                      <div
                        className="h-full"
                        style={{
                          width: `${(physicalScore / (physicalScore + neuroScore)) * 100}%`,
                          backgroundColor: "#3B82F6",
                        }}
                      />
                      <div
                        className="h-full"
                        style={{
                          width: `${(neuroScore / (physicalScore + neuroScore)) * 100}%`,
                          backgroundColor: "rgba(239,68,68,0.8)",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-full w-1/2" style={{ backgroundColor: "#3B82F6" }} />
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Физическая и нейронная нагрузка
              </h3>
              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col items-center gap-2">
                  <LoadRing
                    size={MINI_RING_SIZE}
                    strokeWidth={MINI_RING_STROKE}
                    percent={physicalScore}
                    color="#3B82F6"
                  />
                  <p className="text-xs text-muted-foreground text-center max-w-[120px]">
                    Физическая нагрузка
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <LoadRing
                    size={MINI_RING_SIZE}
                    strokeWidth={MINI_RING_STROKE}
                    percent={neuroScore}
                    color="rgba(239,68,68,0.9)"
                  />
                  <p className="text-xs text-muted-foreground text-center max-w-[120px]">
                    Нервная система
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
