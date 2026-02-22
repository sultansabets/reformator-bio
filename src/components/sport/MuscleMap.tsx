import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";

export interface MuscleProgress {
  chest: number;
  back: number;
  shoulders: number;
  arms: number;
  legs: number;
  abs: number;
}

interface MuscleMapProps {
  progress: MuscleProgress;
  onMuscleClick?: (muscle: keyof MuscleProgress) => void;
}

function getProgressColor(percent: number): string {
  if (percent === 0) return "hsl(var(--muted-foreground) / 0.3)";
  if (percent < 50) return "rgb(249, 115, 22)";
  return "rgb(34, 197, 94)";
}

function MuscleRing({ 
  cx, cy, r, progress, label, onClick 
}: { 
  cx: number; 
  cy: number; 
  r: number; 
  progress: number; 
  label: string;
  onClick?: () => void;
}) {
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;
  const color = getProgressColor(progress);

  return (
    <g 
      onClick={onClick} 
      className="cursor-pointer"
      style={{ pointerEvents: "all" }}
    >
      {/* Background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      {/* Progress ring */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* Label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-[8px] font-medium fill-foreground pointer-events-none"
      >
        {label}
      </text>
      {/* Percent */}
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-[6px] fill-muted-foreground pointer-events-none"
      >
        {progress}%
      </text>
    </g>
  );
}

function BodyFront({ progress, onMuscleClick, t }: { 
  progress: MuscleProgress; 
  onMuscleClick?: (m: keyof MuscleProgress) => void;
  t: (key: string) => string;
}) {
  return (
    <svg viewBox="0 0 200 300" className="w-full h-full max-h-[280px]">
      {/* Body silhouette - minimalist stroke style */}
      <g stroke="currentColor" strokeWidth="1.5" fill="none" className="text-muted-foreground/40">
        {/* Head */}
        <ellipse cx="100" cy="30" rx="18" ry="22" />
        {/* Neck */}
        <path d="M92 50 L92 60 L108 60 L108 50" />
        {/* Torso */}
        <path d="M70 65 Q60 70 55 90 L55 150 Q60 170 75 180 L75 185 Q85 190 100 190 Q115 190 125 185 L125 180 Q140 170 145 150 L145 90 Q140 70 130 65 Q115 60 100 60 Q85 60 70 65" />
        {/* Left arm */}
        <path d="M55 75 Q40 80 35 110 Q30 140 35 170 Q38 180 45 185" />
        {/* Right arm */}
        <path d="M145 75 Q160 80 165 110 Q170 140 165 170 Q162 180 155 185" />
        {/* Left leg */}
        <path d="M80 190 L75 250 Q73 270 78 290" />
        {/* Right leg */}
        <path d="M120 190 L125 250 Q127 270 122 290" />
      </g>

      {/* Muscle progress rings */}
      <MuscleRing 
        cx={100} cy={100} r={16} 
        progress={progress.chest} 
        label={t("center.chest")}
        onClick={() => onMuscleClick?.("chest")}
      />
      <MuscleRing 
        cx={60} cy={130} r={14} 
        progress={progress.arms} 
        label={t("center.arms")}
        onClick={() => onMuscleClick?.("arms")}
      />
      <MuscleRing 
        cx={140} cy={130} r={14} 
        progress={progress.arms} 
        label={t("center.arms")}
        onClick={() => onMuscleClick?.("arms")}
      />
      <MuscleRing 
        cx={70} cy={80} r={12} 
        progress={progress.shoulders} 
        label={t("center.shoulders")}
        onClick={() => onMuscleClick?.("shoulders")}
      />
      <MuscleRing 
        cx={130} cy={80} r={12} 
        progress={progress.shoulders} 
        label={t("center.shoulders")}
        onClick={() => onMuscleClick?.("shoulders")}
      />
      <MuscleRing 
        cx={100} cy={155} r={14} 
        progress={progress.abs} 
        label={t("center.abs")}
        onClick={() => onMuscleClick?.("abs")}
      />
      <MuscleRing 
        cx={85} cy={240} r={14} 
        progress={progress.legs} 
        label={t("center.legs")}
        onClick={() => onMuscleClick?.("legs")}
      />
      <MuscleRing 
        cx={115} cy={240} r={14} 
        progress={progress.legs} 
        label={t("center.legs")}
        onClick={() => onMuscleClick?.("legs")}
      />
    </svg>
  );
}

function BodyBack({ progress, onMuscleClick, t }: { 
  progress: MuscleProgress; 
  onMuscleClick?: (m: keyof MuscleProgress) => void;
  t: (key: string) => string;
}) {
  return (
    <svg viewBox="0 0 200 300" className="w-full h-full max-h-[280px]">
      {/* Body silhouette - back view */}
      <g stroke="currentColor" strokeWidth="1.5" fill="none" className="text-muted-foreground/40">
        {/* Head */}
        <ellipse cx="100" cy="30" rx="18" ry="22" />
        {/* Neck */}
        <path d="M92 50 L92 60 L108 60 L108 50" />
        {/* Torso - back */}
        <path d="M70 65 Q60 70 55 90 L55 150 Q60 170 75 180 L75 185 Q85 190 100 190 Q115 190 125 185 L125 180 Q140 170 145 150 L145 90 Q140 70 130 65 Q115 60 100 60 Q85 60 70 65" />
        {/* Spine hint */}
        <path d="M100 65 L100 180" strokeDasharray="4 4" strokeOpacity="0.5" />
        {/* Left arm */}
        <path d="M55 75 Q40 80 35 110 Q30 140 35 170 Q38 180 45 185" />
        {/* Right arm */}
        <path d="M145 75 Q160 80 165 110 Q170 140 165 170 Q162 180 155 185" />
        {/* Left leg */}
        <path d="M80 190 L75 250 Q73 270 78 290" />
        {/* Right leg */}
        <path d="M120 190 L125 250 Q127 270 122 290" />
      </g>

      {/* Muscle progress rings - back */}
      <MuscleRing 
        cx={100} cy={110} r={18} 
        progress={progress.back} 
        label={t("center.back")}
        onClick={() => onMuscleClick?.("back")}
      />
      <MuscleRing 
        cx={60} cy={130} r={14} 
        progress={progress.arms} 
        label={t("center.arms")}
        onClick={() => onMuscleClick?.("arms")}
      />
      <MuscleRing 
        cx={140} cy={130} r={14} 
        progress={progress.arms} 
        label={t("center.arms")}
        onClick={() => onMuscleClick?.("arms")}
      />
      <MuscleRing 
        cx={70} cy={80} r={12} 
        progress={progress.shoulders} 
        label={t("center.shoulders")}
        onClick={() => onMuscleClick?.("shoulders")}
      />
      <MuscleRing 
        cx={130} cy={80} r={12} 
        progress={progress.shoulders} 
        label={t("center.shoulders")}
        onClick={() => onMuscleClick?.("shoulders")}
      />
      <MuscleRing 
        cx={85} cy={240} r={14} 
        progress={progress.legs} 
        label={t("center.legs")}
        onClick={() => onMuscleClick?.("legs")}
      />
      <MuscleRing 
        cx={115} cy={240} r={14} 
        progress={progress.legs} 
        label={t("center.legs")}
        onClick={() => onMuscleClick?.("legs")}
      />
    </svg>
  );
}

export function MuscleMap({ progress, onMuscleClick }: MuscleMapProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<"front" | "back">("front");

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setView(v => v === "front" ? "back" : "front")}
        className="absolute top-0 right-0 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
        aria-label="Toggle view"
      >
        <RotateCcw className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* View label */}
      <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        {view === "front" ? "Перед" : "Спина"}
      </p>

      {/* Body views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center"
        >
          {view === "front" ? (
            <BodyFront progress={progress} onMuscleClick={onMuscleClick} t={t} />
          ) : (
            <BodyBack progress={progress} onMuscleClick={onMuscleClick} t={t} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
