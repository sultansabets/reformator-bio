import React from "react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "./MetricCard";

function LoadIcon({ className }: { className?: string }) {
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
      <path d="M12 2L4 14h6l-2 8 10-12h-6L12 2" />
    </svg>
  );
}

export interface LoadCardProps {
  percent: number;
  onClick?: () => void;
  size?: "default" | "large";
}

export function LoadCard({ percent, onClick, size }: LoadCardProps) {
  const { t } = useTranslation();
  const iconSize = size === "large" ? "h-8 w-8" : "h-7 w-7";
  return (
    <MetricCard
      percent={percent}
      icon={<LoadIcon className={iconSize} />}
      label={t("center.load")}
      onClick={onClick}
      size={size}
    />
  );
}
