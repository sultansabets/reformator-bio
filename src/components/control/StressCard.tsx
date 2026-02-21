import React from "react";
import { Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface StressCardProps {
  percent: number;
  onClick?: () => void;
  className?: string;
}

const CIRCLE_SIZE = 76;
const STROKE_WIDTH = 3;

function getColorFromStress(percent: number): string {
  if (percent <= 30) return "rgb(34, 197, 94)";
  if (percent <= 60) return "rgb(234, 179, 8)";
  if (percent <= 80) return "rgb(249, 115, 22)";
  return "rgb(220, 38, 38)";
}

function getGlowColorFromStress(percent: number): string {
  if (percent <= 30) return "rgba(34, 197, 94, 0.4)";
  if (percent <= 60) return "rgba(234, 179, 8, 0.4)";
  if (percent <= 80) return "rgba(249, 115, 22, 0.4)";
  return "rgba(220, 38, 38, 0.4)";
}

export function StressCard({ percent, onClick, className }: StressCardProps) {
  const { t } = useTranslation();
  const clamped = Math.min(100, Math.max(0, Math.round(percent)));
  const color = getColorFromStress(clamped);
  const glowColor = getGlowColorFromStress(clamped);

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
          <Brain 
            className="h-7 w-7 transition-colors duration-300" 
            style={{ color }} 
          />
        </div>
      </div>
      <span className="mt-2 text-center text-xs font-medium text-foreground">
        {t("center.stress")}
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
