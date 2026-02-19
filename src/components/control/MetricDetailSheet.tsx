import React from "react";
import { useTranslation } from "react-i18next";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

export type MetricKey = "energy" | "hormones" | "strength";

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
};

export function MetricDetailSheet({
  open,
  onOpenChange,
  detail,
}: MetricDetailSheetProps) {
  const { t } = useTranslation();
  const info = detail ? METRIC_KEYS[detail.key] : null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            {detail && info && (
              <>
                <DrawerTitle className="text-xl font-semibold text-foreground">
                  {detail.title}
                </DrawerTitle>
                <DrawerDescription asChild>
                  <div className="space-y-4 pt-2">
                    <p className="text-2xl font-bold text-foreground">
                      {detail.percent}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {info && t(info.desc)}
                    </p>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("metrics.detailFormula")}
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {info && t(info.formula)}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("metrics.detailSources")}
                      </p>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {info?.sources.map((key) => (
                          <li key={key} className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                            {t(key)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </DrawerDescription>
              </>
            )}
          </DrawerHeader>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
