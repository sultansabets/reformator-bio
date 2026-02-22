import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface SportHeroProps {
  totalWorkouts: number;
  totalXP: number;
  userName?: string;
}

const LEVELS = [
  { level: 1, xp: 0, title: "Новичок" },
  { level: 2, xp: 1000, title: "Начинающий" },
  { level: 3, xp: 2500, title: "Любитель" },
  { level: 4, xp: 5000, title: "Регулярный" },
  { level: 5, xp: 8000, title: "Продвинутый" },
  { level: 6, xp: 12000, title: "Атлет" },
  { level: 7, xp: 18000, title: "Мастер" },
  { level: 8, xp: 25000, title: "Чемпион" },
  { level: 9, xp: 35000, title: "Легенда" },
  { level: 10, xp: 50000, title: "Титан" },
];

function getCurrentLevel(xp: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp) current = lvl;
    else break;
  }
  return current;
}

function getNextLevel(xp: number) {
  for (const lvl of LEVELS) {
    if (xp < lvl.xp) return lvl;
  }
  return LEVELS[LEVELS.length - 1];
}

function getAvatarState(totalWorkouts: number): "base" | "fit" | "athletic" | "powerful" {
  if (totalWorkouts >= 40) return "powerful";
  if (totalWorkouts >= 16) return "athletic";
  if (totalWorkouts >= 6) return "fit";
  return "base";
}

function AvatarSVG({ state, glowColor }: { state: string; glowColor: string }) {
  const muscleScale = state === "powerful" ? 1.15 : state === "athletic" ? 1.08 : state === "fit" ? 1.03 : 1;
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="avatarGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      
      {state !== "base" && (
        <circle cx="50" cy="50" r="48" fill="url(#avatarGlow)" />
      )}
      
      <g transform={`translate(50, 50) scale(${muscleScale}) translate(-50, -50)`}>
        {/* Head */}
        <circle cx="50" cy="28" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
        
        {/* Neck */}
        <path
          d="M44 38 L44 44 L56 44 L56 38"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Shoulders & Torso */}
        <path
          d={state === "powerful" || state === "athletic" 
            ? "M28 48 Q38 44 50 44 Q62 44 72 48 L72 50 Q68 52 64 58 L64 75 Q58 78 50 78 Q42 78 36 75 L36 58 Q32 52 28 50 Z"
            : "M32 48 Q40 45 50 45 Q60 45 68 48 L68 50 Q65 52 62 56 L62 72 Q56 75 50 75 Q44 75 38 72 L38 56 Q35 52 32 50 Z"
          }
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        
        {/* Arms */}
        <path
          d={state === "powerful" 
            ? "M28 50 Q22 55 20 65 Q18 72 22 78"
            : state === "athletic"
            ? "M30 50 Q25 55 23 64 Q21 70 24 76"
            : "M32 50 Q28 55 26 62 Q24 68 26 74"
          }
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d={state === "powerful"
            ? "M72 50 Q78 55 80 65 Q82 72 78 78"
            : state === "athletic"
            ? "M70 50 Q75 55 77 64 Q79 70 76 76"
            : "M68 50 Q72 55 74 62 Q76 68 74 74"
          }
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Legs */}
        <path
          d="M42 75 L40 92"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M58 75 L60 92"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export function SportHero({ totalWorkouts, totalXP, userName }: SportHeroProps) {
  const { t } = useTranslation();
  const currentLevel = getCurrentLevel(totalXP);
  const nextLevel = getNextLevel(totalXP);
  const avatarState = getAvatarState(totalWorkouts);
  
  const xpInCurrentLevel = totalXP - currentLevel.xp;
  const xpNeededForNext = nextLevel.xp - currentLevel.xp;
  const progress = xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;
  
  const glowColors: Record<string, string> = {
    base: "transparent",
    fit: "#34c759",
    athletic: "#007aff",
    powerful: "#af52de",
  };

  return (
    <div className="flex flex-col items-center py-6">
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-24 h-24 mb-4"
      >
        <div 
          className="w-full h-full rounded-full bg-muted/30 p-2 text-foreground"
          style={{
            boxShadow: avatarState !== "base" 
              ? `0 0 30px ${glowColors[avatarState]}40, 0 0 60px ${glowColors[avatarState]}20`
              : undefined
          }}
        >
          <AvatarSVG state={avatarState} glowColor={glowColors[avatarState]} />
        </div>
        
        {/* Level badge */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
          LVL {currentLevel.level}
        </div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-4"
      >
        <p className="text-lg font-semibold text-foreground">{currentLevel.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("center.workouts")}: {totalWorkouts}
        </p>
      </motion.div>

      {/* XP Progress */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-[200px]"
      >
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>{totalXP} XP</span>
          <span>{nextLevel.xp} XP</span>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-1">
          {Math.round(nextLevel.xp - totalXP)} XP до уровня {nextLevel.level}
        </p>
      </motion.div>
    </div>
  );
}

export { LEVELS, getCurrentLevel, getNextLevel };
