import React from "react";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface EnergyCardProps {
  percent: number;
  onClick?: () => void;
}

export function EnergyCard({ percent, onClick }: EnergyCardProps) {
  const { t } = useTranslation();
  return (
    <MetricCard
      percent={percent}
      icon={<Zap className="h-5 w-5" />}
      label={t("metrics.energy")}
      onClick={onClick}
    />
  );
}
