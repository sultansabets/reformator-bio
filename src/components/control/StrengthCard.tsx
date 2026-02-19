import React from "react";
import { Dumbbell } from "lucide-react";
import { MetricCard } from "./MetricCard";

export interface StrengthCardProps {
  percent: number;
  onClick?: () => void;
}

export function StrengthCard({ percent, onClick }: StrengthCardProps) {
  return (
    <MetricCard
      percent={percent}
      icon={<Dumbbell className="h-5 w-5" />}
      label="Сила"
      onClick={onClick}
    />
  );
}
