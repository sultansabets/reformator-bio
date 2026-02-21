import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface StressCardProps {
  onClick?: () => void;
  className?: string;
}

const CIRCLE_SIZE = 76;
const STROKE_WIDTH = 3;

function getRandomPercent(): number {
  return Math.floor(Math.random() * 101);
}

function getColorFromPercent(percent: number): string {
  if (percent <= 30) return "rgb(34, 197, 94)";
  if (percent <= 60) return "rgb(234, 179, 8)";
  if (percent <= 80) return "rgb(249, 115, 22)";
  return "rgb(239, 68, 68)";
}

function ScribbleIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
      <path 
        d="M12 4c-2 0-4 1-5 3-1 2 0 4 1 5s3 2 4 4c1 2 0 4-2 5"
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        fill="none"
      />
      <path 
        d="M8 8c2-1 4 0 5 2s0 4-2 5-4 0-4-2"
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        fill="none"
      />
      <path 
        d="M14 12c1 1 2 3 1 4s-3 1-4 0"
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function StressCard({ onClick, className }: StressCardProps) {
  const { t } = useTranslation();
  const [percent] = useState(getRandomPercent);
  
  const color = getColorFromPercent(percent);

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
          <ScribbleIcon color={color} />
        </div>
      </div>

      <span className="mt-2 text-center text-xs font-medium text-foreground">
        {t("center.stress")}
      </span>
      
      <span
        className="mt-0.5 text-sm font-bold tabular-nums"
        style={{ color }}
      >
        {percent}%
      </span>
    </button>
  );
}
