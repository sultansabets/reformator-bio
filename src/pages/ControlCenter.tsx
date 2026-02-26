import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getGreetingByTime } from "@/lib/greeting";
import { useHealthStore } from "@/store/healthStore";
import HealthOrb from "@/components/control/HealthOrb";
import { SleepCard } from "@/components/control/SleepCard";
import { LoadCard } from "@/components/control/LoadCard";
import { MetricDetailSheet, type MetricDetail } from "@/components/control/MetricDetailSheet";
import { InfluenceFactors } from "@/components/control/InfluenceFactors";
import { DateNavigator } from "@/components/control/DateNavigator";
import { useDateStore } from "@/store/dateStore";

/** Временный флаг: при true показываются идеальные значения для демонстрации UI (98% состояние, 98% сон, 12% нагрузка, всё зелёное) */
const DEMO_MAX_STATE = true;

function formatDateShort(iso: string | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return [d, m, y].filter(Boolean).join(".") || iso;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const ControlCenter = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || t("common.user");
  const [metricSheetOpen, setMetricSheetOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);

  const selectedDate = useDateStore((s) => s.selectedDate);
  const hydrateForDate = useHealthStore((s) => s.hydrateForDate);
  const hydrate = useHealthStore((s) => s.hydrate);
  const sleepPercent = useHealthStore((s) => s.sleepPercent);
  const loadPercent = useHealthStore((s) => s.loadPercent);
  const stress = useHealthStore((s) => s.stress);
  const mainStateScore = useHealthStore((s) => s.mainStateScore);

  const displayState = DEMO_MAX_STATE ? 98 : mainStateScore;
  const displaySleep = DEMO_MAX_STATE ? 98 : sleepPercent;
  const displayLoad = DEMO_MAX_STATE ? 12 : loadPercent;
  const demoGreenHex = DEMO_MAX_STATE ? "#34c759" : undefined;
  const steps = useHealthStore((s) => s.steps);
  const heartRate = useHealthStore((s) => s.heartRate);
  const testosterone = useHealthStore((s) => s.testosterone);
  const testosteroneDate = useHealthStore((s) => s.testosteroneDate);

  useEffect(() => {
    if (!user?.id) return;
    const profile = {
      weight: user.weight,
      height: user.height,
      age: user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : undefined,
      activityLevel: user.activityLevel,
    };
    hydrateForDate(user.id, profile, selectedDate);
  }, [user?.id, user?.weight, user?.height, user?.dob, user?.activityLevel, selectedDate, hydrateForDate]);

  useEffect(() => {
    return () => {
      if (user?.id) {
        hydrate(user.id, {
          weight: user.weight,
          height: user.height,
          age: user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : undefined,
          activityLevel: user.activityLevel,
        });
      }
    };
  }, [user?.id, hydrate]);

  const openMetricSheet = (detail: MetricDetail) => {
    setSelectedMetric(detail);
    setMetricSheetOpen(true);
  };

  return (
    <motion.div
      className="px-5 pt-6 pb-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {DEMO_MAX_STATE && (
        <div className="mb-2 text-center text-xs font-medium" style={{ color: "red" }}>
          DEMO MODE ACTIVE
        </div>
      )}
      <motion.div variants={item} className="mb-4 flex flex-col items-center text-center">
        <p className="text-sm text-muted-foreground">{getGreetingByTime()}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{displayName}</h1>
      </motion.div>

      <motion.div variants={item} className="mt-4 mb-1 flex justify-center overflow-visible">
        <div
          role="button"
          tabIndex={0}
          onClick={() => openMetricSheet({ key: "energy", title: t("energyDetail.title"), percent: displayState })}
          onKeyDown={(e) => e.key === "Enter" && openMetricSheet({ key: "energy", title: t("energyDetail.title"), percent: displayState })}
          className="relative mx-auto flex w-full max-w-[420px] cursor-pointer items-center justify-center overflow-visible"
        >
          <HealthOrb score={displayState} forceColor={demoGreenHex} />
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-5 flex justify-center">
        <div className="grid w-full max-w-[360px] grid-cols-2 justify-items-center gap-x-2 gap-y-2">
          <SleepCard
            percent={displaySleep}
            size="large"
            overrideColor={demoGreenHex}
            onClick={() =>
              openMetricSheet({
                key: "sleep",
                title: t("center.sleep"),
                percent: displaySleep,
              })
            }
          />
          <LoadCard
            percent={displayLoad}
            size="large"
            overrideColor={demoGreenHex}
            onClick={() =>
              openMetricSheet({
                key: "load",
                title: t("center.load"),
                percent: displayLoad,
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
        demoMode={DEMO_MAX_STATE}
        displayState={displayState}
        displaySleep={displaySleep}
        displayLoad={displayLoad}
      />
    </motion.div>
  );
};

export default ControlCenter;
