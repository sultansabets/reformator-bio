import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MarsIconProps {
  className?: string;
  style?: React.CSSProperties;
}

function MarsIcon({ className, style }: MarsIconProps) {
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
      <circle cx="10" cy="14" r="6" />
      <path d="M14.5 9.5L21 3" />
      <path d="M16 3h5v5" />
    </svg>
  );
}

export interface TestosteroneCardProps {
  value?: number | null;
  onClick?: () => void;
  className?: string;
}

const MAX_VALUE = 35;
const CIRCLE_SIZE = 76;
const STROKE_WIDTH = 3;

function getColorFromValue(nmolL: number): string {
  if (nmolL < 10) return "rgb(220, 38, 38)";
  if (nmolL < 18) return "rgb(249, 115, 22)";
  if (nmolL < 25) return "rgb(234, 179, 8)";
  if (nmolL <= 35) return "rgb(34, 197, 94)";
  return "rgb(20, 184, 166)";
}

function getGlowColorFromValue(nmolL: number): string {
  if (nmolL < 10) return "rgba(220, 38, 38, 0.4)";
  if (nmolL < 18) return "rgba(249, 115, 22, 0.4)";
  if (nmolL < 25) return "rgba(234, 179, 8, 0.4)";
  if (nmolL <= 35) return "rgba(34, 197, 94, 0.4)";
  return "rgba(20, 184, 166, 0.4)";
}

export function TestosteroneCard({ value, onClick, className }: TestosteroneCardProps) {
  const { t } = useTranslation();
  const hasValue = value != null;
  const displayValue = value ?? 0;
  
  const percent = hasValue 
    ? displayValue > MAX_VALUE 
      ? 100 
      : Math.min(100, Math.max(0, (displayValue / MAX_VALUE) * 100))
    : 0;
  
  const color = hasValue ? getColorFromValue(displayValue) : "rgb(156, 163, 175)";
  const glowColor = hasValue ? getGlowColorFromValue(displayValue) : "rgba(156, 163, 175, 0.2)";

  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percent / 100) * circumference;

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
          {hasValue && (
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
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <MarsIcon 
            className="h-7 w-7 transition-colors duration-300" 
            style={{ color }} 
          />
        </div>
      </div>
      <span className="mt-2 text-center text-xs font-medium text-foreground">
        {t("center.testosterone")}
      </span>
      <span
        className="mt-0.5 flex items-baseline gap-1 text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {hasValue ? displayValue.toFixed(1) : "—"}
        <span className="text-[10px] font-normal text-muted-foreground">
          нмоль/л
        </span>
      </span>
    </button>
  );
}
