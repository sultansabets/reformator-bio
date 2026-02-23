import React from "react";
import { motion } from "framer-motion";
import { getCurrentLevel, getNextLevel } from "./SportHero";

interface SportXpBlockProps {
  totalXP: number;
}

export function SportXpBlock({ totalXP }: SportXpBlockProps) {
  const currentLevel = getCurrentLevel(totalXP);
  const nextLevel = getNextLevel(totalXP);
  const xpInCurrentLevel = totalXP - currentLevel.xp;
  const xpNeededForNext = nextLevel.xp - currentLevel.xp;
  const progress = xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;
  const xpToNext = Math.round(nextLevel.xp - totalXP);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-muted/30 px-4 py-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">LVL {currentLevel.level}</span>
        <span className="text-[10px] text-muted-foreground">
          {xpToNext > 0 ? `${xpToNext} XP до уровня ${nextLevel.level}` : "Макс. уровень"}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full bg-primary rounded-full"
        />
      </div>
    </motion.div>
  );
}
