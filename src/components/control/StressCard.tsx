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

function getStressColor(percent: number): string {
  if (percent <= 30) return "rgb(34, 197, 94)";
  if (percent <= 60) return "rgb(234, 179, 8)";
  if (percent <= 80) return "rgb(249, 115, 22)";
  return "rgb(239, 68, 68)";
}

function getStressGlowColor(percent: number): string {
  if (percent <= 30) return "rgba(34, 197, 94, 0.4)";
  if (percent <= 60) return "rgba(234, 179, 8, 0.4)";
  if (percent <= 80) return "rgba(249, 115, 22, 0.4)";
  return "rgba(239, 68, 68, 0.4)";
}

function HeadLightningIcon({ className, isHighStress }: { className?: string; isHighStress?: boolean }) {
  return (
    <motion.svg 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      animate={isHighStress ? { opacity: [1, 0.6, 1] } : undefined}
      transition={isHighStress ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {/* Head - simple rounded shape */}
      <circle 
        cx="10" 
        cy="13" 
        r="6"
        stroke="currentColor" 
        strokeWidth="2"
      />
      {/* Neck hint */}
      <path 
        d="M7 18v2M13 18v2"
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Lightning bolt - positioned at temple/top */}
      <path 
        d="M17 3l-2 4h3l-2.5 5"
        stroke="currentColor" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

export function StressCard({ onClick, className }: StressCardProps) {
  const { t } = useTranslation();
  const [percent] = useState(getRandomPercent);
  
  const color = getStressColor(percent);
  const glowColor = getStressGlowColor(percent);

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
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="transition-colors duration-300"
            style={{ color }}
          >
            <HeadLightningIcon className="h-7 w-7" isHighStress={percent > 70} />
          </span>
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
