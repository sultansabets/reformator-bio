import React from "react";
import { Zap } from "lucide-react";
import { LiquidMetricCard } from "./LiquidMetricCard";

export interface EnergyCardProps {
  percent: number;
  onClick?: () => void;
}

export function EnergyCard({ percent, onClick }: EnergyCardProps) {
  return (
    <LiquidMetricCard
      percent={percent}
      icon={<Zap className="h-5 w-5" />}
      label="Энергия"
      onClick={onClick}
    />
  );
}
