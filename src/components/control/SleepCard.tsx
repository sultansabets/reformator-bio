import React from "react";
import { Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface SleepCardProps {
  percent: number;
  onClick?: () => void;
  size?: "default" | "large";
  overrideColor?: string;
}

export function SleepCard({ percent, onClick, size, overrideColor }: SleepCardProps) {
  const { t } = useTranslation();
  const iconSize = size === "large" ? "h-10 w-10" : "h-7 w-7";
  return (
    <MetricCard
      percent={percent}
      icon={<Moon className={iconSize} />}
      label={t("center.sleep")}
      onClick={onClick}
      size={size}
      overrideColor={overrideColor}
    />
  );
}
