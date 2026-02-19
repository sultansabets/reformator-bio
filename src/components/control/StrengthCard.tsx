import React from "react";
import { Dumbbell } from "lucide-react";
import { LiquidFillCard } from "./LiquidFillCard";

function getStrengthColors(_percent: number): {
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
} {
  return {
    gradientFrom: "rgba(22, 163, 74, 0.85)",
    gradientTo: "rgba(74, 222, 128, 0.8)",
    glowColor: "rgba(34, 197, 94, 0.35)",
  };
}

export interface StrengthCardProps {
  percent: number;
  onClick?: () => void;
}

export function StrengthCard({ percent, onClick }: StrengthCardProps) {
  const colors = getStrengthColors(percent);
  return (
    <LiquidFillCard
      percent={percent}
      gradientFrom={colors.gradientFrom}
      gradientTo={colors.gradientTo}
      glowColor={colors.glowColor}
      icon={<Dumbbell className="h-5 w-5" />}
      label="Сила"
      onClick={onClick}
    />
  );
}
