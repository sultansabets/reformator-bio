import React from "react";
import { Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface SleepCardProps {
  percent: number;
  onClick?: () => void;
}

export function SleepCard({ percent, onClick }: SleepCardProps) {
  const { t } = useTranslation();
  return (
    <MetricCard
      percent={percent}
      icon={<Moon className="h-5 w-5" />}
      label={t("center.sleep")}
      onClick={onClick}
    />
  );
}
