import React from "react";
import { Zap } from "lucide-react";
import { LiquidFillCard } from "./LiquidFillCard";

function getEnergyColors(percent: number): {
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
} {
  if (percent < 40) {
    return {
      gradientFrom: "rgba(220, 38, 38, 0.85)",
      gradientTo: "rgba(239, 68, 68, 0.75)",
      glowColor: "rgba(239, 68, 68, 0.4)",
    };
  }
  if (percent < 70) {
    return {
      gradientFrom: "rgba(249, 115, 22, 0.85)",
      gradientTo: "rgba(251, 146, 60, 0.75)",
      glowColor: "rgba(249, 115, 22, 0.4)",
    };
  }
  return {
    gradientFrom: "rgba(34, 197, 94, 0.85)",
    gradientTo: "rgba(74, 222, 128, 0.75)",
    glowColor: "rgba(34, 197, 94, 0.4)",
  };
}

export interface EnergyCardProps {
  percent: number;
  onClick?: () => void;
}

export function EnergyCard({ percent, onClick }: EnergyCardProps) {
  const colors = getEnergyColors(percent);
  return (
    <LiquidFillCard
      percent={percent}
      gradientFrom={colors.gradientFrom}
      gradientTo={colors.gradientTo}
      glowColor={colors.glowColor}
      icon={<Zap className="h-5 w-5" />}
      label="Энергия"
      onClick={onClick}
    />
  );
}
