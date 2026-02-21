import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gauge, Heart, Footprints, BatteryCharging, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

interface InfluenceFactor {
  id: string;
  icon: React.ElementType;
  label: string;
  mainValue: string;
  unit?: string;
  sources: string[];
  iconColor: string;
  iconBg: string;
}

export interface InfluenceFactorsProps {
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  steps?: number;
  recoveryPercent?: number;
}

export function InfluenceFactors({
  systolic = 120,
  diastolic = 80,
  pulse = 62,
  steps = 8500,
  recoveryPercent = 55,
}: InfluenceFactorsProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const recoveryIndex = Math.max(0, Math.min(100, Math.round(recoveryPercent)));

  const factors: InfluenceFactor[] = [
    {
      id: "pressure",
      icon: Gauge,
      label: t("factors.pressure"),
      mainValue: `${systolic}/${diastolic}`,
      unit: "мм рт.ст.",
      sources: [t("factors.systolic"), t("factors.diastolic"), t("factors.deviation")],
      iconColor: "#3B82F6",
      iconBg: "rgba(59,130,246,0.15)",
    },
    {
      id: "pulse",
      icon: Heart,
      label: t("factors.pulse"),
      mainValue: `${pulse}`,
      unit: "bpm",
      sources: [t("factors.restPulse"), t("factors.optimalRange"), t("factors.bpmDeviation")],
      iconColor: "#EF4444",
      iconBg: "rgba(239,68,68,0.15)",
    },
    {
      id: "steps",
      icon: Footprints,
      label: t("factors.steps"),
      mainValue: steps.toLocaleString("ru-RU"),
      unit: "шагов",
      sources: [t("factors.dailySteps"), t("factors.target10k")],
      iconColor: "#22C55E",
      iconBg: "rgba(34,197,94,0.15)",
    },
    {
      id: "recovery",
      icon: BatteryCharging,
      label: t("factors.recovery"),
      mainValue: `${recoveryIndex}%`,
      sources: [t("factors.hrv"), t("factors.sleepQuality"), t("factors.yesterdayLoad")],
      iconColor: "#FF9F0A",
      iconBg: "rgba(255,159,10,0.15)",
    },
  ];

  return (
    <div className="space-y-2">
      {factors.map((f) => {
        const isExpanded = expandedId === f.id;
        const Icon = f.icon;

        return (
          <Card
            key={f.id}
            className="overflow-hidden border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md active:scale-[0.995]"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 p-3 text-left"
              onClick={() => setExpandedId(isExpanded ? null : f.id)}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: f.iconBg }}
              >
                <Icon className="h-5 w-5" style={{ color: f.iconColor }} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="flex items-baseline gap-1.5 text-lg font-bold text-foreground tabular-nums">
                  {f.mainValue}
                  {f.unit && (
                    <span className="text-xs font-normal text-muted-foreground">
                      {f.unit}
                    </span>
                  )}
                </p>
              </div>

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
                      {t("factors.basedOn")}
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {f.sources.map((source) => (
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
