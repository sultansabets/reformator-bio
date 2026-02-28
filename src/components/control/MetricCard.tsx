import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getMetricColor } from "@/lib/colors";

export interface MetricCardProps {
  percent: number;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  /** Larger circle for main page 2-card layout */
  size?: "default" | "large";
  /** If true, treat metric as inverted (0 = good, 100 = bad) */
  inverted?: boolean;
}

const CIRCLE_SIZE = 76;
const CIRCLE_SIZE_LARGE = 120;
const STROKE_WIDTH = 0.3;
const STROKE_WIDTH_LARGE = 0.4;

export function MetricCard({
  percent,
  icon,
  label,
  onClick,
  className,
  size = "default",
  inverted = false,
}: MetricCardProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const color = getMetricColor(clamped, inverted);

  const circleSize = size === "large" ? CIRCLE_SIZE_LARGE : CIRCLE_SIZE;
  const strokeWidth = size === "large" ? STROKE_WIDTH_LARGE : STROKE_WIDTH;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center px-2 py-3",
        size === "large" ? "min-h-[180px]" : "min-h-[130px]",
        "transition-transform duration-200",
        "active:scale-[0.96] hover:opacity-80",
        className,
      )}
    >
      <div className="relative" style={{ width: circleSize, height: circleSize }}>
        <svg
          width={circleSize}
          height={circleSize}
          viewBox={`0 0 ${circleSize} ${circleSize}`}
          className="absolute left-0 top-0"
        >
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="transition-colors duration-300"
            style={{ color }}
          >
            {icon}
          </span>
        </div>
      </div>
      <span className="mt-4 text-center text-xs font-medium text-foreground">
        {label}
      </span>
      <span
        className="mt-1 text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {clamped}%
      </span>
    </button>
  );
}
