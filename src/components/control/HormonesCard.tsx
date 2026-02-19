import React from "react";
import { Flame } from "lucide-react";
import { LiquidFillCard } from "./LiquidFillCard";

function getHormonesColors(_percent: number): {
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
} {
  return {
    gradientFrom: "rgba(194, 65, 12, 0.85)",
    gradientTo: "rgba(251, 146, 60, 0.8)",
    glowColor: "rgba(234, 88, 12, 0.35)",
  };
}

export interface HormonesCardProps {
  percent: number;
  onClick?: () => void;
}

export function HormonesCard({ percent, onClick }: HormonesCardProps) {
  const colors = getHormonesColors(percent);
  return (
    <LiquidFillCard
      percent={percent}
      gradientFrom={colors.gradientFrom}
      gradientTo={colors.gradientTo}
      glowColor={colors.glowColor}
      icon={<Flame className="h-5 w-5" />}
      label="Гормоны"
      onClick={onClick}
    />
  );
}
