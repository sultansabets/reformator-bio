import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gauge, Heart, Footprints, BatteryCharging, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

export type TestosteroneStatus = "low" | "normal" | "high";

interface InfluenceFactor {
  id: string;
  icon: React.ElementType;
  label: string;
  mainValue: string;
  unit?: string;
  subtitle?: string;
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
  testosteroneStatus?: TestosteroneStatus;
  testosteroneGlowing?: boolean;
}

function MarsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <circle cx="10" cy="14" r="5" />
      <path d="M14 10l5-5" />
      <path d="M15 5h4v4" />
    </svg>
  );
}

function getTestosteroneColor(status: TestosteroneStatus): string {
  switch (status) {
    case "low": return "#EF4444";
    case "normal": return "#22C55E";
    case "high": return "#3B82F6";
  }
}

function getTestosteroneBgColor(status: TestosteroneStatus): string {
  switch (status) {
    case "low": return "rgba(239, 68, 68, 0.15)";
    case "normal": return "rgba(34, 197, 94, 0.15)";
    case "high": return "rgba(59, 130, 246, 0.15)";
  }
}

export function InfluenceFactors({
  systolic = 120,
  diastolic = 80,
  pulse = 62,
  steps = 8500,
  recoveryPercent = 55,
  testosteroneStatus = "normal",
  testosteroneGlowing = false,
}: InfluenceFactorsProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const recoveryIndex = Math.max(0, Math.min(100, Math.round(recoveryPercent)));
  const testosteroneColor = getTestosteroneColor(testosteroneStatus);
  const testosteroneBg = getTestosteroneBgColor(testosteroneStatus);

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

  const isTestosteroneExpanded = expandedId === "testosterone";

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
                {f.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{f.subtitle}</p>
                )}
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

      <Card
        className="overflow-hidden border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md active:scale-[0.995]"
      >
        <button
          type="button"
          className="flex w-full items-center gap-3 p-3 text-left"
          onClick={() => setExpandedId(isTestosteroneExpanded ? null : "testosterone")}
        >
          <motion.div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300"
            style={{ backgroundColor: testosteroneBg }}
            animate={testosteroneGlowing ? {
              boxShadow: [
                `0 0 0px ${testosteroneColor}40`,
                `0 0 16px ${testosteroneColor}60`,
                `0 0 0px ${testosteroneColor}40`,
              ]
            } : {}}
            transition={{ duration: 1.5, repeat: testosteroneGlowing ? Infinity : 0 }}
          >
            <MarsIcon 
              className="h-5 w-5 transition-colors duration-300" 
              style={{ color: testosteroneColor }} 
            />
          </motion.div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{t("factors.testosterone")}</p>
            <AnimatePresence mode="wait">
              <motion.p 
                key={testosteroneStatus}
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -5, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold uppercase tracking-wide"
                style={{ color: testosteroneColor }}
              >
                {t(`testosterone.${testosteroneStatus}`)}
              </motion.p>
            </AnimatePresence>
          </div>

          {isTestosteroneExpanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {isTestosteroneExpanded && (
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
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    {t("testosterone.stressCorrelation")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    {t("testosterone.sleepQuality")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                    {t("testosterone.recovery")}
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
