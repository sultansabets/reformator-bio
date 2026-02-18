import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReadinessRingProps {
  score: number;
  /** Optional status label (e.g. body state); when not provided uses default labels */
  statusLabel?: string;
}

const ReadinessRing = ({ score, statusLabel }: ReadinessRingProps) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score)) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  const getStrokeColorClass = () => {
    if (score >= 70) return "stroke-status-green";
    if (score >= 40) return "stroke-status-amber";
    return "stroke-status-red";
  };

  const getLabelColorClass = () => {
    if (score >= 70) return "text-status-green";
    if (score >= 40) return "text-status-amber";
    return "text-status-red";
  };

  const getLabel = () => {
    if (statusLabel) return statusLabel;
    if (score >= 70) return "Оптимально";
    if (score >= 40) return "Умеренно";
    return "Восстановление";
  };

  const displayScore = Math.round(Math.min(100, Math.max(0, score)));

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 180 180" className="h-56 w-56 shrink-0">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="8"
        />
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          className={getStrokeColorClass()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 90 90)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <motion.span
          className="text-5xl font-bold tracking-tight text-foreground"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {displayScore}
        </motion.span>
        <span className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Состояние
        </span>
        <span
          className={cn(
            "mt-1 text-sm font-semibold uppercase tracking-wide",
            getLabelColorClass()
          )}
        >
          {getLabel()}
        </span>
      </div>
    </div>
  );
};

export default ReadinessRing;
