import React, { useState } from "react";
import { Brain, Atom, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

interface FactorItem {
  id: string;
  icon: React.ElementType;
  label: string;
  sources: string[];
}

const FACTORS: FactorItem[] = [
  {
    id: "cns",
    icon: Brain,
    label: "Восстановление ЦНС",
    sources: ["Сон (часы, глубина)", "HRV", "Пульс покоя"],
  },
  {
    id: "hormones",
    icon: Atom,
    label: "Гормональный статус",
    sources: [
      "Тестостерон (если есть)",
      "Энергия",
      "Сон",
      "Стресс",
    ],
  },
  {
    id: "strength",
    icon: Dumbbell,
    label: "Силовая нагрузка",
    sources: ["Тренировки", "Объём", "Интенсивность", "Восстановление"],
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
            className="overflow-hidden border border-border bg-card shadow-sm"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 p-3 text-left"
              onClick={() => setExpandedId(isExpanded ? null : f.id)}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
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
                  <div className="border-t border-border bg-muted/30 px-3 pb-3 pt-2">
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {f.sources.map((s) => (
                        <li key={s} className="flex items-center gap-2">
                          <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                          {s}
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
