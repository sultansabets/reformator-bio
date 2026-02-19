import React from "react";
import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface HormonesCardProps {
  percent: number;
  onClick?: () => void;
}

export function HormonesCard({ percent, onClick }: HormonesCardProps) {
  const { t } = useTranslation();
  return (
    <MetricCard
      percent={percent}
      icon={<Flame className="h-5 w-5" />}
      label={t("metrics.hormones")}
      onClick={onClick}
    />
  );
}
