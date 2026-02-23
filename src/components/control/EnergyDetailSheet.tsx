import React from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
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
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "mx-0 max-h-[calc(100vh-64px)] rounded-t-2xl border-t flex flex-col overflow-hidden"
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
        <DrawerHeader className="shrink-0 border-b px-5 pb-4 pt-2 text-left">
          <DrawerTitle className="text-xl font-semibold">
            {t("energyDetail.title")} — {energyScore}%
          </DrawerTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("energyDetail.subtitle")}
          </p>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
          <div className="space-y-4">
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
