import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { UnifiedBottomSheet } from "@/components/ui/UnifiedBottomSheet";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { calculateAdaptationDetail } from "@/engine/adaptationEngine";
import { useHealthStore } from "@/store/healthStore";

interface AdaptationDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adaptationPercent: number;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <ArrowUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "down") return <ArrowDown className="h-4 w-4 text-amber-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function AdaptationDetailSheet({
  open,
  onOpenChange,
  adaptationPercent,
}: AdaptationDetailSheetProps) {
  const { t } = useTranslation();
  const hrvScore = useHealthStore((s) => s.hrvScore);
  const sleepScore = useHealthStore((s) => s.sleepScore);
  const trainingLoad = useHealthStore((s) => s.trainingLoad);
  const recovery = useHealthStore((s) => s.recovery);
  const dayLabels = t("center.dayLabels", { returnObjects: true }) as string[];

  const detail = useMemo(
    () =>
      calculateAdaptationDetail({
        recovery: adaptationPercent || recovery,
        hrvScore,
        sleepScore,
        trainingLoad,
        dayLabels,
      }),
    [adaptationPercent, recovery, hrvScore, sleepScore, trainingLoad, dayLabels]
  );

  const { adaptationScore, chartData, baselineMin, baselineMax, indicators } = detail;

  return (
    <UnifiedBottomSheet.Root open={open} onOpenChange={onOpenChange}>
      <UnifiedBottomSheet.Content>
        <UnifiedBottomSheet.Header className="text-left">
          <h2 className="text-xl font-semibold">
            {t("adaptationDetail.title")} — {adaptationScore}%
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("adaptationDetail.subtitle")}
          </p>
        </UnifiedBottomSheet.Header>

        <UnifiedBottomSheet.Body>
          <div className="space-y-5">
            <section>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                    <ReferenceArea
                      y1={baselineMin}
                      y2={baselineMax}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.08}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("adaptationDetail.baselineZone", { min: baselineMin, max: baselineMax })}
              </p>
            </section>

            <section>
              <div className="space-y-2">
                {indicators.map((ind) => (
                  <div
                    key={ind.key}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {t(`adaptationDetail.${ind.key}`)} — {t(ind.valueKey)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t(ind.descKey)}</p>
                    </div>
                    <TrendIcon trend={ind.trend} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </UnifiedBottomSheet.Body>
      </UnifiedBottomSheet.Content>
    </UnifiedBottomSheet.Root>
  );
}
