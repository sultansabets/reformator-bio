import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import HealthOrb from "@/components/control/HealthOrb";
import type { MetricsSummary } from "@/api/metricsApi";
import type { MetricDetail } from "@/components/control/MetricDetailSheet";

export interface HealthOrbSectionProps {
  metrics: MetricsSummary | null | undefined;
  onMetricClick: (detail: MetricDetail) => void;
}

const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } } };

export function HealthOrbSection({ metrics, onMetricClick }: HealthOrbSectionProps) {
  const { t } = useTranslation();
  if (!metrics) return null;
  const mainStateScore = metrics.mainStateScore ?? 0;

  return (
    <motion.div
      variants={item}
      className="mt-4 mb-1 flex justify-center overflow-visible"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() =>
          onMetricClick({
            key: "energy",
            title: t("energyDetail.title"),
            percent: mainStateScore,
          })
        }
        onKeyDown={(e) =>
          e.key === "Enter" &&
          onMetricClick({
            key: "energy",
            title: t("energyDetail.title"),
            percent: mainStateScore,
          })
        }
        className="relative mx-auto flex w-full max-w-[420px] cursor-pointer items-center justify-center overflow-visible"
      >
        <HealthOrb score={mainStateScore} />
      </div>
    </motion.div>
  );
}
