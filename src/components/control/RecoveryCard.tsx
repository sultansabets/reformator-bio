import React from "react";
import { BatteryCharging } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface RecoveryCardProps {
  percent: number;
  onClick?: () => void;
}

export function RecoveryCard({ percent, onClick }: RecoveryCardProps) {
  const { t } = useTranslation();
  return (
    <MetricCard
      percent={percent}
      icon={<BatteryCharging className="h-7 w-7" />}
      label={t("center.recovery")}
      onClick={onClick}
    />
  );
}
