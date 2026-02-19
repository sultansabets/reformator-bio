import React from "react";
import { cn } from "@/lib/utils";

/** 0–40 red, 41–70 orange, 71–100 green */
export function getColorFromPercent(percent: number): string {
  if (percent <= 40) return "rgb(220, 38, 38)";
  if (percent <= 70) return "rgb(249, 115, 22)";
  return "rgb(34, 197, 94)";
}

/** Glow color with opacity 0.4–0.5 for soft shadow */
function getGlowColorFromPercent(percent: number): string {
  if (percent <= 40) return "rgba(220, 38, 38, 0.5)";
  if (percent <= 70) return "rgba(249, 115, 22, 0.5)";
  return "rgba(34, 197, 94, 0.5)";
}

export interface MetricCardProps {
  /** 0–100, color derived from this */
  percent: number;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  percent,
  icon,
  label,
  onClick,
  className,
}: MetricCardProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const color = getColorFromPercent(clamped);
  const glowColor = getGlowColorFromPercent(clamped);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-2xl border border-border bg-card px-4 py-5",
        "min-h-[88px] transition-shadow duration-200 hover:shadow-md",
        "active:scale-[0.98]",
        className,
      )}
    >
      <span
        className="transition-all duration-300 ease-out"
        style={{
          color,
          filter: `drop-shadow(0 0 12px ${glowColor})`,
        }}
      >
        {icon}
      </span>
      <span className="mt-2 text-center text-xs font-medium text-foreground">
        {label}
      </span>
      <span className="mt-1 text-base font-bold tabular-nums text-foreground">
        {clamped}%
      </span>
    </button>
  );
}
