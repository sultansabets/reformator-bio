import React from "react";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import type { EnergyEngineResult } from "@/engine/energyEngine";

interface EnergyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  energyDetail: EnergyEngineResult | null;
}

export function EnergyDetailSheet({ open, onOpenChange, energyDetail }: EnergyDetailSheetProps) {
  if (!energyDetail) return null;

  const { energyScore } = energyDetail;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-0 text-left">
          <h2 className="text-xl font-semibold" style={{ color: "#D9FF00" }}>
            Состояние — {energyScore}%
          </h2>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-4" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="text-sm text-foreground leading-relaxed space-y-4">
            <p>
              Состояние – это твоя текущая готовность к физической и умственной нагрузке.
            </p>
            <p>
              Оно формируется из двух факторов:
            </p>
            <p>
              <strong>Сон</strong> – насколько ты восстановился.<br />
              <strong>Нагрузка</strong> – сколько давления уже получил организм.
            </p>
            <p>
              Если ты восстановился и не перегружен – ты в ресурсе.<br />
              Если нагрузка превышает восстановление – ты работаешь в долг у своего организма.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
