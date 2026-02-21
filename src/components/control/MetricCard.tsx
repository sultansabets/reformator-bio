import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/** 0–40 red, 41–60 orange, 61–75 yellow, 76–100 green */
export function getColorFromPercent(percent: number): string {
  if (percent <= 40) return "rgb(220, 38, 38)";
  if (percent <= 60) return "rgb(249, 115, 22)";
  if (percent <= 75) return "rgb(234, 179, 8)";
  return "rgb(34, 197, 94)";
}

function getGlowColorFromPercent(percent: number): string {
  if (percent <= 40) return "rgba(220, 38, 38, 0.4)";
  if (percent <= 60) return "rgba(249, 115, 22, 0.4)";
  if (percent <= 75) return "rgba(234, 179, 8, 0.4)";
  return "rgba(34, 197, 94, 0.4)";
}

export interface MetricCardProps {
  percent: number;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

const CIRCLE_SIZE = 76;
const STROKE_WIDTH = 3;

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

  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center px-2 py-3",
        "min-h-[130px] transition-transform duration-200",
        "active:scale-[0.96] hover:opacity-80",
        className,
      )}
    >
      <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        <svg
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
          className="absolute left-0 top-0"
        >
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={STROKE_WIDTH}
          />
          <motion.circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
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
      <span className="mt-2 text-center text-xs font-medium text-foreground">
        {label}
      </span>
      <span
        className="mt-0.5 text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {clamped}%
      </span>
    </button>
  );
}
