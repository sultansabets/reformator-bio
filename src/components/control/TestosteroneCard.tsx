import React from "react";
import { Dna } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface TestosteroneCardProps {
  value?: number | null;
  onClick?: () => void;
  className?: string;
}

type TestosteroneStatus = "low" | "optimal" | "high" | "elevated";

function getStatus(nmolL: number): TestosteroneStatus {
  if (nmolL < 12) return "low";
  if (nmolL <= 25) return "optimal";
  if (nmolL <= 35) return "high";
  return "elevated";
}

function getStatusColor(status: TestosteroneStatus): string {
  switch (status) {
    case "low":
      return "rgb(220, 38, 38)";
    case "optimal":
      return "rgb(34, 197, 94)";
    case "high":
      return "rgb(134, 239, 172)";
    case "elevated":
      return "rgb(249, 115, 22)";
  }
}

export function TestosteroneCard({ value, onClick, className }: TestosteroneCardProps) {
  const { t } = useTranslation();
  const hasValue = value != null;
  const displayValue = value ?? 0;
  const status = hasValue ? getStatus(displayValue) : null;
  const color = status ? getStatusColor(status) : "rgb(156, 163, 175)";

  const statusLabels: Record<TestosteroneStatus, string> = {
    low: t("testosterone.low"),
    optimal: t("testosterone.optimal"),
    high: t("testosterone.high"),
    elevated: t("testosterone.elevated"),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center px-2 py-3",
        "min-h-[100px] transition-transform duration-200",
        "active:scale-[0.96] hover:opacity-80",
        className,
      )}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}15` }}
      >
        <Dna className="h-6 w-6" style={{ color }} />
      </div>
      <span className="mt-2 text-center text-xs font-medium text-foreground">
        {t("center.testosterone")}
      </span>
      <span
        className="mt-0.5 text-base font-bold tabular-nums"
        style={{ color }}
      >
        {hasValue ? displayValue.toFixed(1) : "—"}
      </span>
      <span className="text-[10px] text-muted-foreground">
        нмоль/л
      </span>
      {status && (
        <span
          className="mt-1 text-[10px] font-medium"
          style={{ color }}
        >
          {statusLabels[status]}
        </span>
      )}
    </button>
  );
}
