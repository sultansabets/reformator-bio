import React, { useState } from "react";
import { Dna, Zap, Dumbbell, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

interface ResourceSystem {
  id: string;
  icon: React.ElementType;
  label: string;
  percent: number;
  sources: string[];
}

export interface ResourceSystemsProps {
  /** Optional overrides; otherwise uses derived defaults */
  hormonalPercent?: number;
  nervousPercent?: number;
  physicalPercent?: number;
  metabolicPercent?: number;
}

export function ResourceSystems({
  hormonalPercent,
  nervousPercent,
  physicalPercent,
  metabolicPercent,
}: ResourceSystemsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const systems: ResourceSystem[] = [
    {
      id: "hormonal",
      icon: Dna,
      label: "Гормональный ресурс",
      percent: hormonalPercent ?? 72,
      sources: ["Тестостерон", "Эстрадиол", "SHBG", "Пролактин"],
    },
    {
      id: "nervous",
      icon: Zap,
      label: "Нервная система",
      percent: nervousPercent ?? 65,
      sources: ["HRV", "Пульс покоя", "Сон", "Стресс"],
    },
    {
      id: "physical",
      icon: Dumbbell,
      label: "Физический потенциал",
      percent: physicalPercent ?? 58,
      sources: ["Тренировки", "Восстановление", "Мышечная масса", "Белок"],
    },
    {
      id: "metabolic",
      icon: Flame,
      label: "Метаболический контроль",
      percent: metabolicPercent ?? 70,
      sources: ["Глюкоза", "Инсулин", "Жир %", "Талия"],
    },
  ];

  return (
    <div className="space-y-2">
      {systems.map((s) => {
        const isExpanded = expandedId === s.id;
        const Icon = s.icon;
        const pct = Math.min(100, Math.max(0, Math.round(s.percent)));
        return (
          <Card
            key={s.id}
            className="overflow-hidden border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md active:scale-[0.995]"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 p-3 text-left"
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                {s.label}
              </span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {pct}%
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
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border bg-muted/25 px-3 pb-3 pt-2">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Сформировано из:
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {s.sources.map((source) => (
                        <li key={source} className="flex items-center gap-2">
                          <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                          {source}
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
