import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { SleepCard } from "@/components/control/SleepCard";
import { LoadCard } from "@/components/control/LoadCard";
import { InfluenceFactors } from "@/components/control/InfluenceFactors";
import { DateNavigator } from "@/components/control/DateNavigator";
import type { MetricsSummary } from "@/api/metricsApi";
import type { MetricDetail } from "@/components/control/MetricDetailSheet";
import { formatMedicalDate } from "@/lib/dateFormat";

export interface MetricsCardsProps {
  metrics: MetricsSummary | null | undefined;
  onMetricClick: (detail: MetricDetail) => void;
}

const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } } };

function computeSleepScore(metrics: MetricsSummary): number {
  if (metrics.sleepPercent != null) return metrics.sleepPercent;
  const sleepMin = metrics.sleepMinutes ?? (metrics.sleepHours != null ? metrics.sleepHours * 60 : null);
  if (sleepMin != null) {
    return Math.min(100, Math.round((sleepMin / 480) * 100));
  }
  return 0;
}

function computeLoadScore(metrics: MetricsSummary): number {
  if (metrics.loadPercent != null) return metrics.loadPercent;
  if (metrics.steps != null) {
    return Math.min(100, Math.round((metrics.steps / 10000) * 100));
  }
  return 0;
}

export function MetricsCards({ metrics, onMetricClick }: MetricsCardsProps) {
  const { t } = useTranslation();
  if (!metrics) return null;
  const sleepPercent = computeSleepScore(metrics);
  const loadPercent = computeLoadScore(metrics);
  const heartRate = metrics.heartRate ?? metrics.avgHeartRate ?? 0;
  const steps = metrics.steps ?? 0;
  const stress = metrics.stress ?? 0;
  const testosterone = metrics.testosterone;
  const testosteroneDate = metrics.testosteroneDate;

  return (
    <>
      <motion.div variants={item} className="mb-5 flex justify-center">
        <div className="grid w-full max-w-[360px] grid-cols-2 justify-items-center gap-x-2 gap-y-2">
          <SleepCard
            percent={sleepPercent}
            size="large"
            onClick={() =>
              onMetricClick({
                key: "sleep",
                title: t("center.sleep"),
                percent: sleepPercent,
              })
            }
          />
          <LoadCard
            percent={loadPercent}
            size="large"
            onClick={() =>
              onMetricClick({
                key: "load",
                title: t("center.load"),
                percent: loadPercent,
              })
            }
          />
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-6 flex justify-center">
        <DateNavigator />
      </motion.div>

      <motion.div variants={item} className="mb-6">
        <InfluenceFactors
          systolic={125}
          diastolic={82}
          pulse={heartRate}
          steps={steps}
          stressPercent={stress}
          testosteroneValue={testosterone != null ? Math.round(testosterone) : undefined}
          testosteroneDate={testosteroneDate ? formatMedicalDate(testosteroneDate) : undefined}
        />
      </motion.div>
    </>
  );
}
