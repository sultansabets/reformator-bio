import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gauge, Heart, Footprints, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";

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

function MarsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="10" cy="14" r="5" />
      <path d="M14 10l5-5" />
      <path d="M15 5h4v4" />
    </svg>
  );
}

function StressPersonLightningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M13 1l-3 5h2l-1 4 4-4h-2l1-5z" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M8 22h8" />
      <path d="M9 16.5c0-1.66 1.34-3 3-3s3 1.34 3 3v4H9v-4z" />
    </svg>
  );
}

interface ExpandableContentProps {
  expanded: boolean;
  children: React.ReactNode;
}

function ExpandableContent({ expanded, children }: ExpandableContentProps) {
  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      {children}
    </div>
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

  return (
    <div className="space-y-2">
      {factors.map((f) => {
        const isExpanded = expandedId === f.id;
        const Icon = f.icon;

        return (
          <Card
            key={f.id}
            role="button"
            tabIndex={0}
            className={`overflow-hidden transition-all duration-300 ease-in-out cursor-pointer ${
              isExpanded
                ? "bg-transparent border-transparent shadow-none"
                : "bg-card border border-border shadow-sm hover:shadow-md active:scale-[0.995]"
            }`}
            onClick={() => setExpandedId(isExpanded ? null : f.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpandedId(isExpanded ? null : f.id);
              }
            }}
          >
            <div className="flex w-full items-center gap-3 p-3 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 transition-colors duration-300">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {f.label}
                </p>
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

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out ${
                  isExpanded ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>

            <ExpandableContent expanded={isExpanded}>
              <div className="px-3 pb-3 pt-1">
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
            </ExpandableContent>
          </Card>
        );
      })}

      <Card
        role="button"
        tabIndex={0}
        className={`overflow-hidden transition-all duration-300 ease-in-out cursor-pointer ${
          isTestosteroneExpanded
            ? "bg-transparent border-transparent shadow-none"
            : "bg-card border border-border shadow-sm hover:shadow-md active:scale-[0.995]"
        }`}
        onClick={() => setExpandedId(isTestosteroneExpanded ? null : "testosterone")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpandedId(isTestosteroneExpanded ? null : "testosterone");
          }
        }}
      >
        <div className="flex w-full items-center gap-3 p-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 transition-colors duration-300">
            <MarsIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              {t("factors.testosterone")}
            </p>
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

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-in-out ${
              isTestosteroneExpanded ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        <ExpandableContent expanded={isTestosteroneExpanded}>
          <div className="px-3 pb-3 pt-1">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("factors.basedOn")}
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {t("factors.labAnalysis")}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {t("factors.hormoneBalance")}
              </li>
            </ul>
          </div>
        </ExpandableContent>
      </Card>
    </div>
  );
}
