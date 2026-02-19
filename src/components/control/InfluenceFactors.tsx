import React, { useState } from "react";
import { Zap, Flame, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

/** Input factors that form each metric. No liquid — analytical cards. */
interface FactorFormula {
  id: string;
  metricKey: "energy" | "hormones" | "strength";
  label: string;
  icon: React.ElementType;
  formula: string;
  items: { name: string; weight?: string }[];
}

const FACTORS: FactorFormula[] = [
  {
    id: "energy",
    metricKey: "energy",
    label: "Энергия",
    icon: Zap,
    formula: "0.4×Сон + 0.3×HRV + 0.2×Стресс + 0.1×Восстановление",
    items: [
      { name: "Сон", weight: "40%" },
      { name: "HRV", weight: "30%" },
      { name: "Стресс", weight: "20%" },
      { name: "Восстановление", weight: "10%" },
    ],
  },
  {
    id: "hormones",
    metricKey: "hormones",
    label: "Гормоны",
    icon: Flame,
    formula: "Сон + Жир % + Тренировки + Тестостерон",
    items: [
      { name: "Сон" },
      { name: "Жир %" },
      { name: "Тренировки" },
      { name: "Тестостерон (если есть)" },
    ],
  },
  {
    id: "strength",
    metricKey: "strength",
    label: "Сила",
    icon: Dumbbell,
    formula: "Объём + Интенсивность + Вес + Восстановление",
    items: [
      { name: "Объём тренировок" },
      { name: "Интенсивность" },
      { name: "Вес" },
      { name: "Восстановление" },
    ],
  },
];

export function InfluenceFactors() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {FACTORS.map((f) => {
        const isExpanded = expandedId === f.id;
        const Icon = f.icon;
        return (
          <Card
            key={f.id}
            className="overflow-hidden border border-border bg-card/80 shadow-sm"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 p-3 text-left"
              onClick={() => setExpandedId(isExpanded ? null : f.id)}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                {f.label}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border bg-muted/25 px-3 pb-3 pt-2">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      Формула:
                    </p>
                    <p className="mb-3 font-mono text-sm text-foreground">
                      {f.formula}
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {f.items.map((item) => (
                        <li key={item.name} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                            {item.name}
                          </span>
                          {item.weight && (
                            <span className="text-xs font-medium text-foreground/80">
                              {item.weight}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}
