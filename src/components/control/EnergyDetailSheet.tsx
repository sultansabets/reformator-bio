import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { getMetricColor } from "@/lib/colors";
import type { EnergyEngineResult } from "@/engine/energyEngine";

interface EnergyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  energyDetail: EnergyEngineResult | null;
}

export function EnergyDetailSheet({ open, onOpenChange, energyDetail }: EnergyDetailSheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  if (!energyDetail) return null;

  const { energyScore, contributions, recommendationKey } = energyDetail;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold">
            {t("energyDetail.title")} — {energyScore}%
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
                {t("energyDetail.whyTitle", { score: energyScore })}
              </h3>
              <div className="flex flex-wrap gap-3">
                {contributions.map((c) => {
                  const deltaColor = getMetricColor(50 + c.delta / 2);
                  return (
                    <div
                      key={c.key}
                      className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">{t(c.labelKey)}: </span>
                      <span style={{ color: deltaColor }}>
                        {c.delta >= 0 ? "+" : ""}{c.delta}%
                      </span>
                    </div>
                  );
                })}
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
