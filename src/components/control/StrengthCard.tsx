import React from "react";
import { Dumbbell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface StrengthCardProps {
  percent: number;
  onClick?: () => void;
}

export function StrengthCard({ percent, onClick }: StrengthCardProps) {
  const { t } = useTranslation();
  return (
    <MetricCard
      percent={percent}
      icon={<Dumbbell className="h-5 w-5" />}
      label={t("metrics.strength")}
      onClick={onClick}
    />
  );
}
