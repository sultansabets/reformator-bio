import React from "react";
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

const METRIC_INFO: Record<
  MetricKey,
  { description: string; sources: string[] }
> = {
  energy: {
    description: "Общий уровень энергии и ресурсов организма.",
    sources: ["Сон", "HRV", "Восстановление", "Стресс"],
  },
  hormones: {
    description: "Гормональный баланс и уровень тестостерона.",
    sources: ["Тестостерон (если есть)", "Энергия", "Сон", "Стресс"],
  },
  strength: {
    description: "Потенциал и готовность к силовым нагрузкам.",
    sources: ["Тренировки", "Объём", "Интенсивность", "Восстановление"],
  },
};

export function MetricDetailSheet({
  open,
  onOpenChange,
  detail,
}: MetricDetailSheetProps) {
  const info = detail ? METRIC_INFO[detail.key] : null;
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto">
          <DrawerHeader className="text-left">
            {detail && (
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
                      {info?.description}
                    </p>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Источники расчёта
                      </p>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {info?.sources.map((s) => (
                          <li key={s} className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                            {s}
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
