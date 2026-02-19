import React from "react";
import { Flame } from "lucide-react";
import { MetricCard } from "./MetricCard";

export interface HormonesCardProps {
  percent: number;
  onClick?: () => void;
}

export function HormonesCard({ percent, onClick }: HormonesCardProps) {
  return (
    <MetricCard
      percent={percent}
      icon={<Flame className="h-5 w-5" />}
      label="Гормоны"
      onClick={onClick}
    />
  );
}
