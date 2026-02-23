import React from "react";
import { useTranslation } from "react-i18next";
import { UnifiedBottomSheet } from "@/components/ui/UnifiedBottomSheet";
import { SleepDetailSheet } from "./SleepDetailSheet";
import { EnergyDetailSheet } from "./EnergyDetailSheet";
import { LoadDetailSheet } from "./LoadDetailSheet";
import { AdaptationDetailSheet } from "./AdaptationDetailSheet";
import { useHealthStore } from "@/store/healthStore";

export type MetricKey = "energy" | "hormones" | "strength" | "sleep" | "load" | "recovery";

export interface MetricDetail {
  key: MetricKey;
  title: string;
  percent: number;
}

interface MetricDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: MetricDetail | null;
}

const METRIC_KEYS: Record<MetricKey, { desc: string; formula: string; sources: string[] }> = {
  energy: {
    desc: "metrics.energyDesc",
    formula: "metrics.energyFormula",
    sources: ["systems.sleep", "systems.hrv", "systems.stress", "systems.recovery"],
  },
  hormones: {
    desc: "metrics.hormonesDesc",
    formula: "metrics.hormonesFormula",
    sources: ["systems.sleep", "systems.fatPct", "systems.workouts", "systems.testosteroneIfAvailable"],
  },
  strength: {
    desc: "metrics.strengthDesc",
    formula: "metrics.strengthFormula",
    sources: ["systems.volume", "systems.intensity", "systems.weight", "systems.recovery"],
  },
  sleep: {
    desc: "metrics.detailSleep",
    formula: "metrics.detailSleepFormula",
    sources: ["systems.sleep", "systems.hrv"],
  },
  load: {
    desc: "metrics.detailLoad",
    formula: "metrics.detailLoadFormula",
    sources: ["systems.volume", "systems.intensity"],
  },
  recovery: {
    desc: "metrics.detailRecovery",
    formula: "metrics.detailRecoveryFormula",
    sources: ["systems.sleep", "systems.hrv", "systems.recovery"],
  },
};

export function MetricDetailSheet({
  open,
  onOpenChange,
  detail,
}: MetricDetailSheetProps) {
  const { t } = useTranslation();
  const sleepDetail = useHealthStore((s) => s.sleepDetail);
  const energyDetail = useHealthStore((s) => s.energyDetail);
  const info = detail ? METRIC_KEYS[detail.key] : null;

  if (detail?.key === "sleep") {
    return <SleepDetailSheet open={open} onOpenChange={onOpenChange} sleepDetail={sleepDetail} />;
  }
  if (detail?.key === "energy") {
    return <EnergyDetailSheet open={open} onOpenChange={onOpenChange} energyDetail={energyDetail} />;
  }
  if (detail?.key === "load") {
    return (
      <LoadDetailSheet
        open={open}
        onOpenChange={onOpenChange}
        loadPercent={detail.percent}
      />
    );
  }
  if (detail?.key === "recovery") {
    return (
      <AdaptationDetailSheet
        open={open}
        onOpenChange={onOpenChange}
        adaptationPercent={detail.percent}
      />
    );
  }

  return (
    <UnifiedBottomSheet.Root open={open} onOpenChange={onOpenChange}>
      <UnifiedBottomSheet.Content>
        <UnifiedBottomSheet.Header className="text-left">
          {detail && info && (
            <>
              <h2 className="text-xl font-semibold text-foreground">
                {detail.title}
              </h2>
            </>
          )}
        </UnifiedBottomSheet.Header>
        {detail && info && (
          <UnifiedBottomSheet.Body>
            <div className="space-y-4">
                <p className="text-2xl font-bold text-foreground">
                  {detail.percent}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(info.desc)}
                </p>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("metrics.detailFormula")}
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {t(info.formula)}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("metrics.detailSources")}
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {info.sources.map((key) => (
                      <li key={key} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
            </div>
          </UnifiedBottomSheet.Body>
        )}
      </UnifiedBottomSheet.Content>
    </UnifiedBottomSheet.Root>
  );
}
