import React from "react";
import { useTranslation } from "react-i18next";
import { UnifiedBottomSheet } from "@/components/ui/UnifiedBottomSheet";
import type { EnergyEngineResult } from "@/engine/energyEngine";

interface EnergyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  energyDetail: EnergyEngineResult | null;
}

export function EnergyDetailSheet({ open, onOpenChange, energyDetail }: EnergyDetailSheetProps) {
  const { t } = useTranslation();
  if (!energyDetail) return null;

  const { energyScore, contributions, recommendationKey } = energyDetail;

  return (
    <UnifiedBottomSheet.Root open={open} onOpenChange={onOpenChange}>
      <UnifiedBottomSheet.Content>
        <UnifiedBottomSheet.Header className="text-left">
          <h2 className="text-xl font-semibold">
            {t("energyDetail.title")} — {energyScore}%
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("energyDetail.subtitle")}
          </p>
        </UnifiedBottomSheet.Header>

        <UnifiedBottomSheet.Body className="space-y-4">
            <section>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                {t("energyDetail.whyTitle", { score: energyScore })}
              </h3>
              <div className="flex flex-wrap gap-3">
                {contributions.map((c) => (
                  <div
                    key={c.key}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      c.delta >= 0 ? "border-border bg-muted/30" : "border-border bg-muted/50"
                    )}
                  >
                    <span className="text-muted-foreground">{t(c.labelKey)}: </span>
                    <span className={c.delta >= 0 ? "text-emerald-600" : "text-amber-600"}>
                      {c.delta >= 0 ? "+" : ""}{c.delta}%
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-foreground">{t(recommendationKey)}</p>
            </section>
        </UnifiedBottomSheet.Body>
      </UnifiedBottomSheet.Content>
    </UnifiedBottomSheet.Root>
  );
}
