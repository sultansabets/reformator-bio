import React, { useState, useMemo } from "react";
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
import { getRecommendedKcal } from "@/lib/health";
import { computeHealthMetrics } from "@/lib/healthEngine";
import { getLatestLab, getTestosteroneStatus } from "@/lib/labs";
import { getStorageKey } from "@/lib/userStorage";
import HealthOrb from "@/components/control/HealthOrb";
import { SleepCard } from "@/components/control/SleepCard";
import { LoadCard } from "@/components/control/LoadCard";
import { TestosteroneCard } from "@/components/control/TestosteroneCard";
import { MetricDetailSheet, type MetricDetail } from "@/components/control/MetricDetailSheet";
import { InfluenceFactors } from "@/components/control/InfluenceFactors";

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readTodayKcal(nutritionKey: string): number {
  try {
    const raw = localStorage.getItem(nutritionKey);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayDateString()) return 0;
    const day = parsed;
    const sum = (arr: { manualKcal?: number; kcalPer100?: number; grams?: number }[]) =>
      arr.reduce((s, i) => {
        const k = i.manualKcal ?? (i.kcalPer100 && i.grams ? (i.grams / 100) * i.kcalPer100 : 0);
        return s + Math.round(k);
      }, 0);
    return sum(day.breakfast ?? []) + sum(day.lunch ?? []) + sum(day.dinner ?? []) + sum(day.snacks ?? []);
  } catch {
    return 0;
  }
}

function readTodayWater(waterKey: string): { current: number; goal: number } {
  try {
    const raw = localStorage.getItem(waterKey);
    const today = getTodayDateString();
    if (!raw) return { current: 0, goal: 2500 };
    const parsed = JSON.parse(raw);
    if (parsed.lastUpdatedDate !== today) return { current: 0, goal: Number(parsed.goal) || 2500 };
    return { current: Number(parsed.current) || 0, goal: Number(parsed.goal) || 2500 };
  } catch {
    return { current: 0, goal: 2500 };
  }
}

function readTodayWorkout(workoutHistoryKey: string): { durationSec: number; caloriesBurned: number } {
  try {
    const raw = localStorage.getItem(workoutHistoryKey);
    if (!raw) return { durationSec: 0, caloriesBurned: 0 };
    const list = JSON.parse(raw);
    const today = getTodayDateString();
    const todayEntries = Array.isArray(list) ? list.filter((e: { date: string }) => e.date === today) : [];
    const durationSec = todayEntries.reduce((s: number, e: { durationSec?: number }) => s + (e.durationSec ?? 0), 0);
    const caloriesBurned = todayEntries.reduce((s: number, e: { caloriesBurned?: number }) => s + (e.caloriesBurned ?? 0), 0);
    return { durationSec, caloriesBurned };
  } catch {
    return { durationSec: 0, caloriesBurned: 0 };
  }
}

function testosteroneNgDlToNmolL(ngDl: number): number {
  return ngDl * 0.0347;
}

function workoutIntensityFromToday(durationSec: number, caloriesBurned: number): number {
  if (durationSec <= 0) return 0;
  const minutes = durationSec / 60;
  const intensityFromDuration = Math.min(10, (minutes / 45) * 6);
  const intensityFromCal = Math.min(4, caloriesBurned / 100);
  return Math.round(Math.min(10, intensityFromDuration + intensityFromCal * 0.5));
}

const sleepData = [
  { day: "Пн", hours: 7.2, quality: 80 },
  { day: "Вт", hours: 6.8, quality: 65 },
  { day: "Ср", hours: 7.5, quality: 85 },
  { day: "Чт", hours: 8.0, quality: 90 },
  { day: "Пт", hours: 6.5, quality: 60 },
  { day: "Сб", hours: 7.8, quality: 82 },
  { day: "Вс", hours: 7.4, quality: 78 },
];
const loadData = [
  { day: "Пн", load: 8.2 },
  { day: "Вт", load: 14.5 },
  { day: "Ср", load: 10.1 },
  { day: "Чт", load: 16.3 },
  { day: "Пт", load: 6.8 },
  { day: "Сб", load: 12.4 },
  { day: "Вс", load: 9.7 },
];
const recoveryData = [
  { day: "Пн", score: 72 },
  { day: "Вт", score: 65 },
  { day: "Ср", score: 78 },
  { day: "Чт", score: 85 },
  { day: "Пт", score: 60 },
  { day: "Сб", score: 80 },
  { day: "Вс", score: 82 },
];

const sleepLast3Days = [
  { day: "Позавчера", hours: 7.2 },
  { day: "Вчера", hours: 6.8 },
  { day: "Сегодня", hours: 7.5 },
];

const SLEEP_AVG_HOURS =
  (sleepLast3Days[0].hours + sleepLast3Days[1].hours + sleepLast3Days[2].hours) / 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const ControlCenter = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || t("common.user");
  const [metricSheetOpen, setMetricSheetOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricDetail | null>(null);

  const storageKeys = useMemo(() => {
    if (!user?.id) return null;
    return {
      nutrition: getStorageKey(user.id, "nutrition"),
      water: getStorageKey(user.id, "water"),
      workout_history: getStorageKey(user.id, "workout_history"),
      labs: getStorageKey(user.id, "labs"),
    };
  }, [user?.id]);

  const { metrics, latestLab, todayKcal, todayWorkout } = useMemo(() => {
    const keys = storageKeys ?? {
      nutrition: "reformator_bio_nutrition",
      water: "reformator_bio_water",
      workout_history: "reformator_bio_workout_history",
      labs: "reformator_bio_labs",
    };
    const water = readTodayWater(keys.water);
    const workout = readTodayWorkout(keys.workout_history);
    const recommended = user?.height && user?.weight ? getRecommendedKcal(user.height, user.weight) : null;
    const targetKcal = recommended?.target ?? 2000;
    const lab = getLatestLab(keys.labs);
    const testosteroneNmolL = lab?.testosterone != null ? testosteroneNgDlToNmolL(lab.testosterone) : undefined;
    const input = {
      sleepHours: 7.5,
      caloriesConsumed: readTodayKcal(keys.nutrition),
      caloriesTarget: targetKcal,
      workoutIntensity: workoutIntensityFromToday(workout.durationSec, workout.caloriesBurned),
      waterMl: water.current,
      age: 30,
      weight: user?.weight ?? 70,
      height: user?.height ?? 170,
      labs: {
        testosterone: testosteroneNmolL,
        bilirubin: lab?.other?.bilirubin,
        uricAcid: lab?.other?.uricAcid,
        platelets: lab?.other?.platelets,
      },
    };
    const healthMetrics = computeHealthMetrics(input);
    return {
      metrics: healthMetrics,
      latestLab: lab,
      todayKcal: readTodayKcal(keys.nutrition),
      todayWorkout: readTodayWorkout(keys.workout_history),
    };
  }, [user?.height, user?.weight, storageKeys]);

  const stressScore = metrics.stressScore;
  const recoveryScore = metrics.recoveryScore;
  const testosteroneValue = 56;
  const testosteroneStatusKey = testosteroneValue != null ? getTestosteroneStatus(testosteroneValue) : null;

  const sleepPercent = useMemo(() => {
    const actual = SLEEP_AVG_HOURS;
    const target = 8;
    let base = (actual / target) * 100;
    const stability = 0.85;
    if (stability >= 0.8) base += 5;
    return clamp(Math.round(base), 0, 100);
  }, []);

  const loadPercent = useMemo(() => {
    const targetActiveKcal = 400;
    const targetSteps = 10000;
    const activeKcal = todayWorkout.caloriesBurned || 180;
    const steps = 6500;
    const kcalPart = (activeKcal / targetActiveKcal) * 50;
    const stepsPart = (steps / targetSteps) * 50;
    return clamp(Math.round(kcalPart + stepsPart), 0, 100);
  }, [todayWorkout.caloriesBurned]);

  const recoveryPercent = useMemo(() => {
    const sleepPart = sleepPercent * 0.4;
    const hrvValue = 45;
    const hrvPart = clamp((hrvValue / 60) * 100, 0, 100) * 0.4;
    const yesterdayLoad = 65;
    const loadPenalty = yesterdayLoad * 0.2;
    return clamp(Math.round(sleepPart + hrvPart - loadPenalty), 0, 100);
  }, [sleepPercent]);

  const sleepQualityPercent = useMemo(() => {
    const sleepRatio = (SLEEP_AVG_HOURS / 8) * 60;
    const stabilityBonus = 20;
    const wakeupPenalty = 5;
    return clamp(Math.round(sleepRatio + stabilityBonus - wakeupPenalty), 0, 100);
  }, []);

  const openMetricSheet = (detail: MetricDetail) => {
    setSelectedMetric(detail);
    setMetricSheetOpen(true);
  };

  const bodyStateScore = 85;

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
          <HealthOrb score={bodyStateScore} />
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
          <TestosteroneCard
            value={testosteroneValue}
            onClick={() =>
              openMetricSheet({
                key: "testosterone",
                title: t("center.testosterone"),
                percent: 0,
              })
            }
          />
        </div>
      </motion.div>

      <motion.div variants={item} className="mb-6">
        <InfluenceFactors
          systolic={125}
          diastolic={82}
          pulse={62}
          steps={8500}
          recoveryPercent={recoveryPercent}
        />
      </motion.div>

      <motion.div variants={item} className="space-y-4">
        <div>
          <p className="mb-1 text-sm font-medium text-foreground">
            {t("center.sleepQuality")}: {sleepQualityPercent}%
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
