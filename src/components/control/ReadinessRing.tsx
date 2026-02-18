import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReadinessRingProps {
  score: number;
  /** Optional status label (e.g. body state); when not provided uses default labels */
  statusLabel?: string;
}

const ReadinessRing = ({ score, statusLabel }: ReadinessRingProps) => {
  const size = 250;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const progressValue = typeof progress === "number" ? progress : 0;
  const dashOffset =
    circumference - (progressValue / 100) * circumference;

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

  const displayScore = Math.round(progress);

  return (
    <div className="relative h-[250px] w-[250px]">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute left-0 top-0"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className={getStrokeColorClass()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
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
        <span className="mt-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Состояние
        </span>
        <span
          className={cn(
            "mt-1 text-base font-semibold uppercase tracking-wide",
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
