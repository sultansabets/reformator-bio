import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dna, Zap, Dumbbell, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { colors } from "@/theme/colors";

interface ResourceSystem {
  id: string;
  icon: React.ElementType;
  label: string;
  percent: number;
  sources: string[];
  iconColor: string;
  iconBg: string;
}

function rgba(hex: string, alpha: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
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
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const systems: ResourceSystem[] = [
    {
      id: "hormonal",
      icon: Dna,
      label: t("systems.hormonal"),
      percent: hormonalPercent ?? 72,
      sources: [t("systems.testosterone"), t("systems.estradiol"), t("systems.shbg"), t("systems.prolactin")],
      iconColor: colors.state.good,
      iconBg: rgba(colors.state.good, 0.15),
    },
    {
      id: "nervous",
      icon: Zap,
      label: t("systems.nervous"),
      percent: nervousPercent ?? 65,
      sources: [t("systems.hrv"), t("systems.restPulse"), t("systems.sleep"), t("systems.stress")],
      iconColor: colors.state.okay,
      iconBg: rgba(colors.state.okay, 0.15),
    },
    {
      id: "physical",
      icon: Dumbbell,
      label: t("systems.physical"),
      percent: physicalPercent ?? 58,
      sources: [t("systems.workouts"), t("systems.recovery"), t("systems.muscleMass"), t("systems.protein")],
      iconColor: colors.state.good,
      iconBg: rgba(colors.state.good, 0.15),
    },
    {
      id: "metabolic",
      icon: Flame,
      label: t("systems.metabolic"),
      percent: metabolicPercent ?? 70,
      sources: [t("systems.glucose"), t("systems.insulin"), t("systems.fatPct"), t("systems.waist")],
      iconColor: colors.state.good,
      iconBg: rgba(colors.state.good, 0.15),
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
            className="overflow-hidden border border-border bg-card shadow-sm transition-all duration-fast ease-primary hover:shadow-md hover:scale-[1.02] active:scale-[0.97]"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 p-3 text-left"
              onClick={() => setExpandedId(isExpanded ? null : s.id)}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [backdrop-filter:blur(2px)]"
                style={{ backgroundColor: s.iconBg }}
              >
                <Icon className="h-4 w-4" style={{ color: s.iconColor }} />
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
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border bg-muted/25 px-3 pb-3 pt-2">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("systems.formedFrom")}
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
