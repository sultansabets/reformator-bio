import React, { useId } from "react";
import { cn } from "@/lib/utils";

/** 0–40% red, 41–70% orange, 71–100% green — dynamic per percent */
function getColorsFromPercent(percent: number): {
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  reflectionColor: string;
} {
  if (percent <= 40) {
    return {
      gradientFrom: "rgba(220, 38, 38, 0.9)",
      gradientTo: "rgba(239, 68, 68, 0.8)",
      glowColor: "rgba(239, 68, 68, 0.45)",
      reflectionColor: "rgba(255,255,255,0.25)",
    };
  }
  if (percent <= 70) {
    return {
      gradientFrom: "rgba(249, 115, 22, 0.9)",
      gradientTo: "rgba(251, 146, 60, 0.8)",
      glowColor: "rgba(249, 115, 22, 0.45)",
      reflectionColor: "rgba(255,255,255,0.3)",
    };
  }
  return {
    gradientFrom: "rgba(22, 163, 74, 0.9)",
    gradientTo: "rgba(74, 222, 128, 0.85)",
    glowColor: "rgba(34, 197, 94, 0.45)",
    reflectionColor: "rgba(255,255,255,0.35)",
  };
}

export interface LiquidMetricCardProps {
  /** 0–100, color derived from this */
  percent: number;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function LiquidMetricCard({
  percent,
  icon,
  label,
  onClick,
  className,
}: LiquidMetricCardProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const fillHeight = `${clamped}%`;
  const colors = getColorsFromPercent(clamped);
  const gradientId = useId().replace(/:/g, "-");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        "min-h-[88px] transition-shadow duration-200 hover:shadow-lg",
        "active:scale-[0.98]",
        className,
      )}
    >
      {/* Liquid fill */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 w-full transition-[height] duration-700 ease-in-out"
          style={{ height: fillHeight }}
        >
          {/* Base gradient + glow */}
          <div
            className="absolute inset-0 w-full"
            style={{
              background: `linear-gradient(to top, ${colors.gradientFrom}, ${colors.gradientTo})`,
              boxShadow: `inset 0 0 20px 1px ${colors.glowColor}, 0 0 12px 1px ${colors.glowColor}`,
            }}
          />
          {/* Soft wave — small amplitude, slow, smooth easing, light edge blur */}
          <div
            className="absolute left-0 right-0 top-0 h-5 w-[200%] [filter:blur(0.5px)]"
            style={{
              animation: "liquid-wave-soft 5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          >
            <svg
              className="h-full w-full"
              viewBox="0 0 200 20"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={colors.gradientTo} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={colors.reflectionColor} stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#${gradientId})`}
                d="M0,10 Q50,6 100,10 T200,10 L200,20 L0,20 Z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-2 py-4 [text-shadow:0_1px_3px_rgba(0,0,0,0.12)]">
        <span className="text-foreground">{icon}</span>
        <span className="mt-1 text-center text-xs font-medium text-foreground">
          {label}
        </span>
        <span className="mt-0.5 text-base font-bold text-foreground">{clamped}%</span>
      </div>
    </button>
  );
}
