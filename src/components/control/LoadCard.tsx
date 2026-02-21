import React from "react";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface LoadCardProps {
  percent: number;
  onClick?: () => void;
}

export function LoadCard({ percent, onClick }: LoadCardProps) {
  const { t } = useTranslation();
  return (
    <MetricCard
      percent={percent}
      icon={<Activity className="h-5 w-5" />}
      label={t("center.load")}
      onClick={onClick}
    />
  );
}
