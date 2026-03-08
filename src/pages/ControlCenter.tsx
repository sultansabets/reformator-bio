import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { getGreetingByTime } from "@/lib/greeting";
import { useHealthStore, hasValidMetrics } from "@/store/healthStore";
import { useMetricsSummaryQuery } from "@/hooks/useMetricsQuery";
import { getAccessToken } from "@/api/apiClient";
import HealthOrb from "@/components/control/HealthOrb";
import { SleepCard } from "@/components/control/SleepCard";
import { LoadCard } from "@/components/control/LoadCard";
import { MetricDetailSheet, type MetricDetail } from "@/components/control/MetricDetailSheet";
import { InfluenceFactors } from "@/components/control/InfluenceFactors";
import { DateNavigator } from "@/components/control/DateNavigator";
import { useDateStore } from "@/store/dateStore";
import { Button } from "@/components/ui/button";

function formatDateShort(iso: string | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return [d, m, y].filter(Boolean).join(".") || iso;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } } };

const ControlCenter = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: profile } = useProfileQuery();
  const initials =
    [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .map((s) => (s as string)[0])
      .join("")
      .toUpperCase() || undefined;
  const displayName =
    profile?.nickname?.trim() ??
    profile?.firstName?.trim() ??
    initials ??
    t("common.user");
  const [metricSheetOpen, setMetricSheetOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);

  const selectedDate = useDateStore((s) => s.selectedDate);
  const metricsQuery = useMetricsSummaryQuery(selectedDate, !!getAccessToken());
  const hasMetrics = metricsQuery.data != null && hasValidMetrics(metricsQuery.data);
  const baseline = metricsQuery.data?.baseline;
  const showOnboarding =
    !metricsQuery.isLoading &&
    metricsQuery.isSuccess &&
    (metricsQuery.data == null || !hasValidMetrics(metricsQuery.data));

  const sleepPercent = useHealthStore((s) => s.sleepPercent);
  const loadPercent = useHealthStore((s) => s.loadPercent);
  const stress = useHealthStore((s) => s.stress);
  const mainStateScore = useHealthStore((s) => s.mainStateScore);
  const steps = useHealthStore((s) => s.steps);
  const heartRate = useHealthStore((s) => s.heartRate);
  const testosterone = useHealthStore((s) => s.testosterone);
  const testosteroneDate = useHealthStore((s) => s.testosteroneDate);

  const openMetricSheet = (detail: MetricDetail) => {
    setSelectedMetric(detail);
    setMetricSheetOpen(true);
  };

  if (metricsQuery.isLoading && !hasMetrics) {
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
        <p className="text-sm text-muted-foreground">{getGreetingByTime()}</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">{displayName}</h1>
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

  if (!baseline) {
    const bp = metricsQuery.data?.baselineProgress;
    return (
      <motion.div
        className="flex min-h-[60vh] flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-sm text-muted-foreground">{getGreetingByTime()}</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">{displayName}</h1>
        <p className="mt-6 max-w-[280px] text-center text-muted-foreground">
          {t("adaptationDetail.collecting")}
        </p>
        {bp && bp.collected > 0 && bp.required > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("adaptationDetail.dayOfRequired", {
              collected: bp.collected,
              required: bp.required,
            })}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="px-5 pt-6 pb-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="mb-4 flex flex-col items-center text-center">
        <p className="text-sm text-muted-foreground">{getGreetingByTime()}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{displayName}</h1>
      </motion.div>

      <motion.div variants={item} className="mt-4 mb-1 flex justify-center overflow-visible">
        <div
          role="button"
          tabIndex={0}
          onClick={() => openMetricSheet({ key: "energy", title: t("energyDetail.title"), percent: mainStateScore })}
          onKeyDown={(e) => e.key === "Enter" && openMetricSheet({ key: "energy", title: t("energyDetail.title"), percent: mainStateScore })}
          className="relative mx-auto flex w-full max-w-[420px] cursor-pointer items-center justify-center overflow-visible"
        >
          <HealthOrb score={mainStateScore} />
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-5 flex justify-center">
        <div className="grid w-full max-w-[360px] grid-cols-2 justify-items-center gap-x-2 gap-y-2">
          <SleepCard
            percent={sleepPercent}
            size="large"
            onClick={() =>
              openMetricSheet({
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
              openMetricSheet({
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
          testosteroneDate={formatDateShort(testosteroneDate)}
        />
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
