import React from "react";
import { Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface SleepCardProps {
  percent: number;
  onClick?: () => void;
  size?: "default" | "large";
}

export function SleepCard({ percent, onClick, size }: SleepCardProps) {
  const { t } = useTranslation();
  const iconSize = size === "large" ? "h-12 w-12" : "h-7 w-7";
  return (
    <MetricCard
      percent={percent}
      icon={<Moon className={iconSize} />}
      label={t("center.sleep")}
      onClick={onClick}
      size={size}
    />
  );
}
