import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type StressLevel = "low" | "medium" | "high";

export interface StressCardProps {
  onClick?: () => void;
  className?: string;
}

const CIRCLE_SIZE = 76;
const STROKE_WIDTH = 3;

function getRandomLevel(): StressLevel {
  const levels: StressLevel[] = ["low", "medium", "high"];
  return levels[Math.floor(Math.random() * 3)];
}

function getColorFromLevel(level: StressLevel): string {
  switch (level) {
    case "low": return "rgb(34, 197, 94)";
    case "medium": return "rgb(245, 158, 11)";
    case "high": return "rgb(239, 68, 68)";
  }
}

function getPercentFromLevel(level: StressLevel): number {
  switch (level) {
    case "low": return 25;
    case "medium": return 55;
    case "high": return 85;
  }
}

function getLevelLabel(level: StressLevel, t: (key: string) => string): string {
  switch (level) {
    case "low": return t("stress.low");
    case "medium": return t("stress.medium");
    case "high": return t("stress.high");
  }
}

function StressIcon({ level, color }: { level: StressLevel; color: string }) {
  if (level === "low") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
        <path d="M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  
  if (level === "medium") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
        <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
        <path d="M8 10h8M8 14h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
      <path d="M8 9h8M8 12h8M8 15h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function StressCard({ onClick, className }: StressCardProps) {
  const { t } = useTranslation();
  const [level] = useState<StressLevel>(getRandomLevel);
  
  const color = getColorFromLevel(level);
  const percent = getPercentFromLevel(level);

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
        "active:scale-[0.96] hover:opacity-90",
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
            opacity={0.4}
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
            transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <StressIcon level={level} color={color} />
        </div>
      </div>

      <span className="mt-2 text-center text-xs font-medium text-foreground">
        {t("center.stress")}
      </span>
      
      <span
        className="mt-0.5 text-sm font-bold uppercase tracking-wide"
        style={{ color }}
      >
        {getLevelLabel(level, t)}
      </span>
    </button>
  );
}
