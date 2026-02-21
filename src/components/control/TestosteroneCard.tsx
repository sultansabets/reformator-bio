import React from "react";
import { Dna } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

export interface TestosteroneCardProps {
  percent: number;
  onClick?: () => void;
}

export function TestosteroneCard({ percent, onClick }: TestosteroneCardProps) {
  const { t } = useTranslation();
  return (
    <MetricCard
      percent={percent}
      icon={<Dna className="h-5 w-5" />}
      label={t("center.testosterone")}
      onClick={onClick}
    />
  );
}
