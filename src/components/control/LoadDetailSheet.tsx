import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, ReferenceArea } from "recharts";
import { calculateLoadDetail } from "@/engine/loadEngine";
import { useHealthStore } from "@/store/healthStore";

interface LoadDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loadPercent: number;
}

const ZONE_COLORS = {
  optimal: "hsl(var(--status-green))",
  high: "hsl(var(--status-amber))",
  overload: "hsl(var(--status-red))",
};

export function LoadDetailSheet({ open, onOpenChange, loadPercent }: LoadDetailSheetProps) {
  const { t } = useTranslation();
  const trainingLoad = useHealthStore((s) => s.trainingLoad);
  const steps = useHealthStore((s) => s.steps);
  const workouts = useHealthStore((s) => s.workouts);
  const dayLabels = t("center.dayLabels", { returnObjects: true }) as string[];

  const detail = useMemo(
    () =>
      calculateLoadDetail({
        loadPercent,
        trainingLoad,
        steps,
        workoutsCount: workouts.length,
        dayLabels,
      }),
    [loadPercent, trainingLoad, steps, workouts.length, dayLabels]
  );

  const { loadScore, chartData, optimalMin, optimalMax, breakdown } = detail;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "mx-0 max-h-[calc(100vh-64px)] rounded-t-2xl border-t flex flex-col overflow-hidden"
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
        <DrawerHeader className="shrink-0 border-b px-5 pb-4 pt-2 text-left">
          <DrawerTitle className="text-xl font-semibold">
            {t("loadDetail.title")} — {loadScore}%
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
          <div className="space-y-5">
            <section>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                    <ReferenceArea y1={optimalMin} y2={optimalMax} fill="hsl(var(--status-green))" fillOpacity={0.15} />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Bar dataKey="load" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={ZONE_COLORS[entry.zone] ?? ZONE_COLORS.optimal} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("loadDetail.optimalRange", { min: optimalMin, max: optimalMax })}
              </p>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                {t("loadDetail.breakdownTitle")}
              </h3>
              <div className="space-y-2">
                {breakdown.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <p className="font-medium text-foreground">
                      {t(`loadDetail.${item.key}`)} — {t(item.valueKey)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(item.descKey)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
