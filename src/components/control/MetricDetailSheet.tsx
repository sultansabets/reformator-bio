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
  { description: string; formula: string; sources: string[] }
> = {
  energy: {
    description: "Итоговый уровень энергии. Формируется из входных факторов.",
    formula: "0.4×Сон + 0.3×HRV + 0.2×Стресс + 0.1×Восстановление",
    sources: ["Сон", "HRV", "Стресс", "Восстановление"],
  },
  hormones: {
    description: "Гормональный баланс. Формируется из входных факторов.",
    formula: "Сон + Жир % + Тренировки + Тестостерон",
    sources: ["Сон", "Жир %", "Тренировки", "Тестостерон (если есть)"],
  },
  strength: {
    description: "Потенциал силовых нагрузок. Формируется из входных факторов.",
    formula: "Объём + Интенсивность + Вес + Восстановление",
    sources: ["Объём тренировок", "Интенсивность", "Вес", "Восстановление"],
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
                      {info.description}
                    </p>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Формула
                      </p>
                      <p className="font-mono text-sm text-foreground">
                        {info.formula}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Входные данные
                      </p>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {info.sources.map((s) => (
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
