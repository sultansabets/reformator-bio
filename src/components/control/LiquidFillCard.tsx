import React from "react";
import { cn } from "@/lib/utils";

export interface LiquidFillCardProps {
  /** 0–100 */
  percent: number;
  /** CSS gradient stops or color */
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function LiquidFillCard({
  percent,
  gradientFrom,
  gradientTo,
  glowColor,
  icon,
  label,
  onClick,
  className,
}: LiquidFillCardProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const fillHeight = `${clamped}%`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        "min-h-[88px] transition-shadow duration-200 hover:shadow-md",
        "active:scale-[0.98]",
        className,
      )}
    >
      {/* Fill container */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 w-full transition-[height] duration-700 ease-in-out"
          style={{ height: fillHeight }}
        >
          {/* Gradient fill */}
          <div
            className="absolute inset-0 w-full"
            style={{
              background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
              boxShadow: `0 0 20px 2px ${glowColor}`,
            }}
          />
          {/* Top wave — gentle curve */}
          <svg
            className="absolute left-0 right-0 top-0 w-full"
            viewBox="0 0 120 10"
            preserveAspectRatio="none"
          >
            <path
              fill={gradientTo}
              d="M0,5 Q30,0 60,5 T120,5 L120,10 L0,10 Z"
              opacity="0.85"
            />
          </svg>
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-2 py-4 [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">
        <span className="text-foreground/95">{icon}</span>
        <span className="mt-1 text-center text-xs font-medium text-foreground">
          {label}
        </span>
        <span className="mt-0.5 text-base font-bold text-foreground">{clamped}%</span>
      </div>
    </button>
  );
}
