import { motion } from "framer-motion";

interface ReadinessRingProps {
  score: number;
}

const ReadinessRing = ({ score }: ReadinessRingProps) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = () => {
    if (score >= 70) return "hsl(var(--status-green))";
    if (score >= 40) return "hsl(var(--status-amber))";
    return "hsl(var(--status-red))";
  };

  const getLabel = () => {
    if (score >= 70) return "Оптимально";
    if (score >= 40) return "Умеренно";
    return "Восстановление";
  };

  return (
    <div className="relative flex flex-col items-center">
      <svg width="180" height="180" viewBox="0 0 180 180">
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
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 90 90)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-5xl font-bold tracking-tight text-foreground"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: getColor() }}
        >
          {getLabel()}
        </span>
      </div>
    </div>
  );
};

export default ReadinessRing;
