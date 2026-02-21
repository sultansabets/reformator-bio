import React, { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export type StressLevel = "low" | "medium" | "high";

export interface StressCardProps {
  basePercent: number;
  onStressChange?: (percent: number, level: StressLevel) => void;
  onClick?: () => void;
  className?: string;
}

const CIRCLE_SIZE = 76;
const STROKE_WIDTH = 3;

const FLUCTUATION_INTERVAL = 2500;
const FLUCTUATION_RANGE = 4;

function getStressLevel(percent: number): StressLevel {
  if (percent <= 35) return "low";
  if (percent <= 65) return "medium";
  return "high";
}

function getColorFromLevel(level: StressLevel): string {
  switch (level) {
    case "low": return "rgb(34, 197, 94)";
    case "medium": return "rgb(245, 158, 11)";
    case "high": return "rgb(239, 68, 68)";
  }
}

function getGlowColorFromLevel(level: StressLevel): string {
  switch (level) {
    case "low": return "rgba(34, 197, 94, 0.5)";
    case "medium": return "rgba(245, 158, 11, 0.5)";
    case "high": return "rgba(239, 68, 68, 0.6)";
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

export function StressCard({ basePercent, onStressChange, onClick, className }: StressCardProps) {
  const { t } = useTranslation();
  const [displayPercent, setDisplayPercent] = useState(basePercent);
  const [prevLevel, setPrevLevel] = useState<StressLevel | null>(null);
  const [isLevelChanging, setIsLevelChanging] = useState(false);
  const fluctuationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const currentLevel = getStressLevel(displayPercent);
  const color = getColorFromLevel(currentLevel);
  const glowColor = getGlowColorFromLevel(currentLevel);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const updateFluctuation = useCallback(() => {
    const delta = (Math.random() - 0.5) * FLUCTUATION_RANGE * 2;
    fluctuationRef.current = clamp(fluctuationRef.current + delta, -FLUCTUATION_RANGE, FLUCTUATION_RANGE);
    const newPercent = clamp(Math.round(basePercent + fluctuationRef.current), 0, 100);
    
    setDisplayPercent((prev) => {
      const newLevel = getStressLevel(newPercent);
      const oldLevel = getStressLevel(prev);
      
      if (newLevel !== oldLevel) {
        setPrevLevel(oldLevel);
        setIsLevelChanging(true);
        setTimeout(() => setIsLevelChanging(false), 600);
      }
      
      return newPercent;
    });
  }, [basePercent]);

  useEffect(() => {
    fluctuationRef.current = 0;
    setDisplayPercent(basePercent);
  }, [basePercent]);

  useEffect(() => {
    const interval = setInterval(updateFluctuation, FLUCTUATION_INTERVAL);
    return () => clearInterval(interval);
  }, [updateFluctuation]);

  useEffect(() => {
    if (onStressChange) {
      onStressChange(displayPercent, currentLevel);
    }
  }, [displayPercent, currentLevel, onStressChange]);

  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (displayPercent / 100) * circumference;

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
      <motion.div 
        className="relative" 
        style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
        animate={isLevelChanging ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
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
            animate={{ 
              strokeDashoffset: dashOffset,
              filter: `drop-shadow(0 0 ${isLevelChanging ? 12 : 6}px ${glowColor})`
            }}
            transition={{ 
              strokeDashoffset: { duration: 0.8, ease: "easeOut" },
              filter: { duration: 0.3 }
            }}
          />
        </svg>
        
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          animate={isLevelChanging ? { rotate: [0, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLevel}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <StressIcon level={currentLevel} color={color} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <span className="mt-2 text-center text-xs font-medium text-foreground">
        {t("center.stress")}
      </span>
      
      <AnimatePresence mode="wait">
        <motion.span
          key={currentLevel}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -5, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-0.5 text-sm font-bold uppercase tracking-wide"
          style={{ color }}
        >
          {getLevelLabel(currentLevel, t)}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
