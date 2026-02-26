import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { EnergyEngineResult } from "@/engine/energyEngine";

interface EnergyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  energyDetail: EnergyEngineResult | null;
  demoMode?: boolean;
  displayScore?: number;
}

export function EnergyDetailSheet({ open, onOpenChange, energyDetail, demoMode, displayScore = 98 }: EnergyDetailSheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  if (!energyDetail) return null;

  const { energyScore, contributions, recommendationKey } = energyDetail;
  const showScore = demoMode ? displayScore : energyScore;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold">
            {t("energyDetail.title")} — {showScore}%
          </h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {expanded ? (
              <p className="whitespace-pre-line">{t("energyDetail.subtitleFull")}</p>
            ) : (
              <p>{t("energyDetail.subtitleShort")}</p>
            )}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1.5 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground/80 transition-colors"
            >
              {expanded ? (
                <>
                  {t("energyDetail.showLess")}
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  {t("energyDetail.showMore")}
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="space-y-4">
            <section>
              <h3 className="mb-3 text-sm font-medium text-foreground">
                {t("energyDetail.whyTitle", { score: showScore })}
              </h3>
              <div className="flex flex-wrap gap-3">
                {contributions.map((c) => (
                  <div
                    key={c.key}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      demoMode ? "border-border bg-muted/30" : c.delta >= 0 ? "border-border bg-muted/30" : "border-border bg-muted/50"
                    )}
                  >
                    <span className="text-muted-foreground">{t(c.labelKey)}: </span>
                    <span className={demoMode ? "text-emerald-600" : c.delta >= 0 ? "text-emerald-600" : "text-amber-600"}>
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
