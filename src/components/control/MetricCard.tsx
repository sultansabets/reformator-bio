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

  const size = 56;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

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
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute left-0 top-0"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
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
