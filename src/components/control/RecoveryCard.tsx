import React from "react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

function AdaptationIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 19 L12 5 L19 19" />
    </svg>
  );
}

export interface RecoveryCardProps {
  percent: number;
  onClick?: () => void;
}

export function RecoveryCard({ percent, onClick }: RecoveryCardProps) {
  const { t } = useTranslation();
  return (
    <MetricCard
      percent={percent}
      icon={<AdaptationIcon className="h-7 w-7" />}
      label={t("center.recovery")}
      onClick={onClick}
    />
  );
}
