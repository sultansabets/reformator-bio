import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gauge, Heart, Footprints, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

/** All expanded cards glow with the same green accent */
const EXPANDED_ACCENT_COLOR = "#D9FF00";

interface InfluenceFactor {
  id: string;
  icon: React.ElementType;
  label: string;
  mainValue: string;
  unit?: string;
  subtitle?: string;
  sources: string[];
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

/** Person silhouette with lightning above head — outline, minimal */
function StressPersonLightningIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
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
      <path d="M13 1l-3 5h2l-1 4 4-4h-2l1-5z" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M8 22h8" />
      <path d="M9 16.5c0-1.66 1.34-3 3-3s3 1.34 3 3v4H9v-4z" />
    </svg>
  );
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
      icon: StressPersonLightningIcon,
      label: t("center.stress"),
      mainValue: `${stressIndex}%`,
      sources: [t("factors.hrv"), t("factors.sleepQuality"), t("factors.yesterdayLoad")],
    },
  ];

  const isTestosteroneExpanded = expandedId === "testosterone";
  const testosteroneColor = isTestosteroneExpanded ? EXPANDED_ACCENT_COLOR : undefined;

  return (
    <div className="space-y-2">
      {factors.map((f) => {
        const isExpanded = expandedId === f.id;
        const Icon = f.icon;
        const accentColor = isExpanded ? EXPANDED_ACCENT_COLOR : undefined;
        const cardBg = accentColor ? { backgroundColor: `${accentColor}14` } : undefined; // ~8% opacity

        const cardStyle = accentColor
          ? {
              backgroundColor: `${accentColor}14`,
              boxShadow: `0 0 12px ${accentColor}30`,
              borderColor: `${accentColor}40`,
            }
          : undefined;

        return (
          <Card
            key={f.id}
            role="button"
            tabIndex={0}
            className="overflow-hidden border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.995] cursor-pointer"
            style={cardStyle}
            onClick={() => setExpandedId(isExpanded ? null : f.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpandedId(isExpanded ? null : f.id);
              }
            }}
          >
            <div className="flex w-full items-center gap-3 p-3 text-left">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${accentColor ? "" : "bg-muted/50"}`}
                style={accentColor ? { backgroundColor: `${accentColor}20` } : undefined}
              >
                <Icon
                  className={`h-5 w-5 transition-colors duration-200 ${accentColor ? "" : "text-muted-foreground"}`}
                  style={accentColor ? { color: accentColor } : undefined}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs transition-colors duration-200 ${accentColor ? "" : "text-muted-foreground"}`}
                  style={accentColor ? { color: accentColor } : undefined}
                >
                  {f.label}
                </p>
                <p
                  className={`flex items-baseline gap-1.5 text-lg font-bold tabular-nums transition-colors duration-200 ${accentColor ? "" : "text-foreground"}`}
                  style={accentColor ? { color: accentColor } : undefined}
                >
                  {f.mainValue}
                  {f.unit && (
                    <span
                      className={`text-xs font-normal transition-colors duration-200 ${accentColor ? "" : "text-muted-foreground"}`}
                      style={accentColor ? { color: `${accentColor}99` } : undefined}
                    >
                      {f.unit}
                    </span>
                  )}
                </p>
                {f.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{f.subtitle}</p>
                )}
              </div>

              {isExpanded ? (
                <ChevronUp
                  className="h-4 w-4 shrink-0 transition-colors duration-200"
                  style={accentColor ? { color: accentColor } : undefined}
                />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
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
                    style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}
                  >
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {t("factors.basedOn")}
                    </p>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {f.sources.map((source) => (
                        <li key={source} className="flex items-center gap-2">
                          <span
                            className="h-1 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: accentColor || "hsl(var(--muted-foreground))" }}
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

      {(() => {
        const testosteroneCardStyle = testosteroneColor
          ? {
              backgroundColor: `${testosteroneColor}14`,
              boxShadow: `0 0 12px ${testosteroneColor}30`,
              borderColor: `${testosteroneColor}40`,
            }
          : undefined;

        return (
          <Card
            role="button"
            tabIndex={0}
            className="overflow-hidden border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.995] cursor-pointer"
            style={testosteroneCardStyle}
            onClick={() => setExpandedId(isTestosteroneExpanded ? null : "testosterone")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpandedId(isTestosteroneExpanded ? null : "testosterone");
              }
            }}
          >
            <div className="flex w-full items-center gap-3 p-3 text-left">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${testosteroneColor ? "" : "bg-muted/50"}`}
                style={testosteroneColor ? { backgroundColor: `${testosteroneColor}20` } : undefined}
              >
                <MarsIcon
                  className={`h-5 w-5 transition-colors duration-200 ${testosteroneColor ? "" : "text-muted-foreground"}`}
                  style={testosteroneColor ? { color: testosteroneColor } : undefined}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs transition-colors duration-200 ${testosteroneColor ? "" : "text-muted-foreground"}`}
                  style={testosteroneColor ? { color: testosteroneColor } : undefined}
                >
                  {t("factors.testosterone")}
                </p>
                {hasTestosterone ? (
                  <>
                    <p
                      className={`flex items-baseline gap-1.5 text-lg font-bold tabular-nums transition-colors duration-200 ${testosteroneColor ? "" : "text-foreground"}`}
                      style={testosteroneColor ? { color: testosteroneColor } : undefined}
                    >
                      {testosteroneValue}
                      <span
                        className={`text-xs font-normal transition-colors duration-200 ${testosteroneColor ? "" : "text-muted-foreground"}`}
                        style={testosteroneColor ? { color: `${testosteroneColor}99` } : undefined}
                      >
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
                <ChevronUp
                  className="h-4 w-4 shrink-0 transition-colors duration-200"
                  style={testosteroneColor ? { color: testosteroneColor } : undefined}
                />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
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
        );
      })()}
    </div>
  );
}
