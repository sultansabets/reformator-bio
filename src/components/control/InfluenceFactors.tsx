import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gauge, Heart, Footprints, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

/** 0–40 red, 41–60 orange, 61–75 yellow, 76–100 green (stress: high % = bad = red) */
function getFactorColorFromPercent(percent: number): string {
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  if (p <= 40) return "rgb(220, 38, 38)";
  if (p <= 60) return "rgb(249, 115, 22)";
  if (p <= 75) return "rgb(234, 179, 8)";
  return "rgb(34, 197, 94)";
}

/** Stress: low % = good (green), high % = bad (red) — inverted */
function getStressFactorColor(percent: number): string {
  return getFactorColorFromPercent(100 - Math.min(100, Math.max(0, percent)));
}

interface InfluenceFactor {
  id: string;
  icon: React.ElementType;
  label: string;
  mainValue: string;
  unit?: string;
  subtitle?: string;
  sources: string[];
  /** Color only when expanded; null = neutral */
  getExpandedColor?: () => string;
}

export interface InfluenceFactorsProps {
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  steps?: number;
  stressPercent?: number;
  testosteroneValue?: number | null;
  testosteroneDate?: string;
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

function getTestosteroneColor(value: number): string {
  if (value <= 10) return "#EF4444";
  if (value <= 18) return "#F97316";
  if (value <= 35) return "#22C55E";
  return "#14B8A6";
}

export function InfluenceFactors({
  systolic = 120,
  diastolic = 80,
  pulse = 62,
  steps = 8500,
  stressPercent = 50,
  testosteroneValue = 56,
  testosteroneDate = "12.03.2026",
}: InfluenceFactorsProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stressIndex = Math.max(0, Math.min(100, Math.round(stressPercent)));
  const hasTestosterone = testosteroneValue != null;

  const factors: InfluenceFactor[] = [
    {
      id: "pressure",
      icon: Gauge,
      label: t("factors.pressure"),
      mainValue: `${systolic}/${diastolic}`,
      unit: "мм рт.ст.",
      sources: [t("factors.systolic"), t("factors.diastolic"), t("factors.deviation")],
    },
    {
      id: "pulse",
      icon: Heart,
      label: t("factors.pulse"),
      mainValue: `${pulse}`,
      unit: "bpm",
      sources: [t("factors.restPulse"), t("factors.optimalRange"), t("factors.bpmDeviation")],
    },
    {
      id: "steps",
      icon: Footprints,
      label: t("factors.steps"),
      mainValue: steps.toLocaleString("ru-RU"),
      unit: "шагов",
      sources: [t("factors.dailySteps"), t("factors.target10k")],
    },
    {
      id: "stress",
      icon: Zap,
      label: t("center.stress"),
      mainValue: `${stressIndex}%`,
      sources: [t("factors.hrv"), t("factors.sleepQuality"), t("factors.yesterdayLoad")],
      getExpandedColor: () => getStressFactorColor(stressPercent),
    },
  ];

  const isTestosteroneExpanded = expandedId === "testosterone";
  const testosteroneColor = hasTestosterone && isTestosteroneExpanded
    ? getTestosteroneColor(testosteroneValue!)
    : undefined;

  return (
    <div className="space-y-2">
      {factors.map((f) => {
        const isExpanded = expandedId === f.id;
        const Icon = f.icon;
        const iconColor = isExpanded && f.getExpandedColor ? f.getExpandedColor() : undefined;

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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                <Icon
                  className="h-5 w-5 text-muted-foreground transition-colors duration-200"
                  style={iconColor ? { color: iconColor } : undefined}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="flex items-baseline gap-1.5 text-lg font-bold tabular-nums text-foreground">
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
                  <div
                    className="border-t border-border bg-muted/25 px-3 pb-3 pt-2"
                    style={iconColor ? { borderLeft: `3px solid ${iconColor}` } : undefined}
                  >
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("factors.basedOn")}
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {f.sources.map((source) => (
                        <li key={source} className="flex items-center gap-2">
                          <span
                            className="h-1 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: iconColor || "hsl(var(--muted-foreground))" }}
                          />
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
            <MarsIcon
              className="h-5 w-5 text-muted-foreground transition-colors duration-200"
              style={testosteroneColor ? { color: testosteroneColor } : undefined}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{t("factors.testosterone")}</p>
            {hasTestosterone ? (
              <>
                <p className="flex items-baseline gap-1.5 text-lg font-bold tabular-nums text-foreground">
                  {testosteroneValue}
                  <span className="text-xs font-normal text-muted-foreground">
                    нмоль/л
                  </span>
                </p>
                {testosteroneDate && (
                  <p className="text-[10px] text-muted-foreground">
                    {t("factors.asOf")} {testosteroneDate}
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg font-bold text-muted-foreground">
                {t("factors.noData")}
              </p>
            )}
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
              <div
                className="border-t border-border bg-muted/25 px-3 pb-3 pt-2"
                style={testosteroneColor ? { borderLeft: `3px solid ${testosteroneColor}` } : undefined}
              >
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {t("factors.basedOn")}
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: testosteroneColor || "hsl(var(--muted-foreground))" }}
                    />
                    {t("factors.labAnalysis")}
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: testosteroneColor || "hsl(var(--muted-foreground))" }}
                    />
                    {t("factors.hormoneBalance")}
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
