import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { hasValidMetrics } from "@/store/healthStore";
import { useMetricsSummaryQuery } from "@/hooks/useMetricsQuery";
import { getAccessToken } from "@/api/apiClient";
import { useDateStore } from "@/store/dateStore";
import { MetricDetailSheet, type MetricDetail } from "@/components/control/MetricDetailSheet";
import { Button } from "@/components/ui/button";
import {
  GreetingHeader,
  BaselineBanner,
  BaselineSuccessBanner,
  HealthOrbSection,
  MetricsCards,
} from "@/components/dashboard";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } } };

const ControlCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profileQuery = useProfileQuery();
  const profile = profileQuery.data;

  const [metricSheetOpen, setMetricSheetOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);
  const [showBaselineSuccess, setShowBaselineSuccess] = useState(false);
  const hasShownBaselineSuccessRef = useRef(false);

  const selectedDate = useDateStore((s) => s.selectedDate);
  const metricsQuery = useMetricsSummaryQuery(selectedDate, !!getAccessToken());
  const metrics = metricsQuery?.data;

  const showOnboarding =
    !metricsQuery.isLoading &&
    metricsQuery.isSuccess &&
    (metrics == null || !hasValidMetrics(metrics));

  const openMetricSheet = (detail: MetricDetail) => {
    setSelectedMetric(detail);
    setMetricSheetOpen(true);
  };

  useEffect(() => {
    if (!metrics) return;
    const baseline = metrics.baseline;
    const baselineProgress = metrics.baselineProgress;
    const collected = baselineProgress?.collected ?? 0;
    const required = baselineProgress?.required ?? 5;
    const baselineJustCompleted = required > 0 && collected >= required;
    if (baselineJustCompleted && !hasShownBaselineSuccessRef.current) {
      hasShownBaselineSuccessRef.current = true;
      setShowBaselineSuccess(true);
      const timer = setTimeout(() => setShowBaselineSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [metrics]);

  if (metricsQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-6">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <GreetingHeader profile={profile} />
        <p className="mt-6 max-w-[280px] text-center text-muted-foreground">
          {t("onboarding.connectDevice")}
        </p>
        <Button
          className="mt-6"
          onClick={() => navigate("/onboarding/data-source")}
        >
          {t("onboarding.connectDeviceCta")}
        </Button>
      </motion.div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-6">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const baseline = metrics.baseline;
  const baselineProgress = metrics.baselineProgress;
  const collected = baselineProgress?.collected ?? 0;
  const required = baselineProgress?.required ?? 5;
  const isLearning = !baseline;

  return (
    <motion.div
      className="px-5 pt-6 pb-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <GreetingHeader profile={profile} />
      </motion.div>

      <motion.div variants={item}>
        <BaselineSuccessBanner show={showBaselineSuccess} />
      </motion.div>

      <motion.div variants={item}>
        <BaselineBanner
          isLearning={isLearning}
          collected={collected}
          required={required}
        />
      </motion.div>

      <HealthOrbSection metrics={metrics} onMetricClick={openMetricSheet} />

      <motion.div variants={container}>
        <MetricsCards metrics={metrics} onMetricClick={openMetricSheet} />
      </motion.div>

      <MetricDetailSheet
        open={metricSheetOpen}
        onOpenChange={setMetricSheetOpen}
        detail={selectedMetric}
      />
    </motion.div>
  );
};

export default ControlCenter;
