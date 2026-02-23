import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { getGreetingByTime } from "@/lib/greeting";
import { useHealthStore } from "@/store/healthStore";
import LiquidState from "@/components/LiquidState";
import { SleepCard } from "@/components/control/SleepCard";
import { LoadCard } from "@/components/control/LoadCard";
import { RecoveryCard } from "@/components/control/RecoveryCard";
import { MetricDetailSheet, type MetricDetail } from "@/components/control/MetricDetailSheet";
import { InfluenceFactors } from "@/components/control/InfluenceFactors";

function formatDateShort(iso: string | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return [d, m, y].filter(Boolean).join(".") || iso;
}

const sleepDataRaw = [
  { dayIdx: 0, hours: 7.2, quality: 80 },
  { dayIdx: 1, hours: 6.8, quality: 65 },
  { dayIdx: 2, hours: 7.5, quality: 85 },
  { dayIdx: 3, hours: 8.0, quality: 90 },
  { dayIdx: 4, hours: 6.5, quality: 60 },
  { dayIdx: 5, hours: 7.8, quality: 82 },
  { dayIdx: 6, hours: 7.4, quality: 78 },
];
const loadDataRaw = [
  { dayIdx: 0, load: 8.2 },
  { dayIdx: 1, load: 14.5 },
  { dayIdx: 2, load: 10.1 },
  { dayIdx: 3, load: 16.3 },
  { dayIdx: 4, load: 6.8 },
  { dayIdx: 5, load: 12.4 },
  { dayIdx: 6, load: 9.7 },
];
const recoveryDataRaw = [
  { dayIdx: 0, score: 72 },
  { dayIdx: 1, score: 65 },
  { dayIdx: 2, score: 78 },
  { dayIdx: 3, score: 85 },
  { dayIdx: 4, score: 60 },
  { dayIdx: 5, score: 80 },
  { dayIdx: 6, score: 82 },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const ControlCenter = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || t("common.user");
  const [metricSheetOpen, setMetricSheetOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);

  const sleepPercent = useHealthStore((s) => s.sleepPercent);
  const loadPercent = useHealthStore((s) => s.loadPercent);
  const recovery = useHealthStore((s) => s.recovery);
  const stress = useHealthStore((s) => s.stress);
  const mainStateScore = useHealthStore((s) => s.mainStateScore);
  const sleepScore = useHealthStore((s) => s.sleepScore);
  const steps = useHealthStore((s) => s.steps);
  const heartRate = useHealthStore((s) => s.heartRate);
  const testosterone = useHealthStore((s) => s.testosterone);
  const testosteroneDate = useHealthStore((s) => s.testosteroneDate);

  const dayLabels = t("center.dayLabels", { returnObjects: true }) as string[];
  const sleepData = sleepDataRaw.map((d) => ({ ...d, day: dayLabels[d.dayIdx] }));
  const loadData = loadDataRaw.map((d) => ({ ...d, day: dayLabels[d.dayIdx] }));
  const recoveryData = recoveryDataRaw.map((d) => ({ ...d, day: dayLabels[d.dayIdx] }));

  const openMetricSheet = (detail: MetricDetail) => {
    setSelectedMetric(detail);
    setMetricSheetOpen(true);
  };

  return (
    <motion.div
      className="px-5 pt-6 pb-24"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="mb-4 flex flex-col items-center text-center">
        <p className="text-sm text-muted-foreground">{getGreetingByTime()}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{displayName}</h1>
      </motion.div>

      <motion.div variants={item} className="mt-4 mb-4 flex justify-center overflow-visible">
        <div className="relative mx-auto flex w-full max-w-[420px] items-center justify-center overflow-visible">
          <LiquidState score={mainStateScore} />
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <SleepCard
            percent={sleepPercent}
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
            onClick={() =>
              openMetricSheet({
                key: "load",
                title: t("center.load"),
                percent: loadPercent,
              })
            }
          />
          <RecoveryCard
            percent={recovery}
            onClick={() =>
              openMetricSheet({
                key: "recovery",
                title: t("center.recovery"),
                percent: recovery,
              })
            }
          />
        </div>
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

      <motion.div variants={item} className="space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-foreground">
            {t("center.sleepQuality")}: {sleepScore}%
          </p>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("center.sleepTrends")}
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={sleepData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis hide domain={[5, 9]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("center.load")}
        </h2>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={loadData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Line type="monotone" dataKey="load" stroke="hsl(var(--status-amber))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--status-amber))" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("center.recovery")}
        </h2>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={recoveryData}>
              <defs>
                <linearGradient id="recoveryGradMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--status-green))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--status-green))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis hide domain={[50, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="hsl(var(--status-green))" strokeWidth={2} fill="url(#recoveryGradMain)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
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
