import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getGreetingByTime } from "@/lib/greeting";
import { getRecommendedKcal } from "@/lib/health";
import { computeHealthMetrics } from "@/lib/healthEngine";
import { getLatestLab, getTestosteroneStatus } from "@/lib/labs";
import { getStorageKey } from "@/lib/userStorage";
import HealthOrb from "@/components/control/HealthOrb";
import { EnergyCard } from "@/components/control/EnergyCard";
import { HormonesCard } from "@/components/control/HormonesCard";
import { StrengthCard } from "@/components/control/StrengthCard";
import { MetricDetailSheet, type MetricDetail } from "@/components/control/MetricDetailSheet";
import { ResourceSystems } from "@/components/control/ResourceSystems";

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

function readKcalLast3Days(nutritionKey: string): { date: string; kcal: number }[] {
  const today = getTodayDateString();
  const todayKcal = readTodayKcal(nutritionKey);
  const result: { date: string; kcal: number }[] = [{ date: today, kcal: todayKcal }];
  for (let i = 1; i <= 2; i++) {
    const d = getDateDaysAgo(i);
    try {
      const raw = localStorage.getItem(nutritionKey);
      if (!raw) {
        result.push({ date: d, kcal: 0 });
        continue;
      }
      const parsed = JSON.parse(raw);
      if (parsed.date !== d) {
        result.push({ date: d, kcal: 0 });
        continue;
      }
      const sum = (arr: { manualKcal?: number; kcalPer100?: number; grams?: number }[]) =>
        arr.reduce((s, i) => {
          const k = i.manualKcal ?? (i.kcalPer100 && i.grams ? (i.grams / 100) * i.kcalPer100 : 0);
          return s + Math.round(k);
        }, 0);
      result.push({
        date: d,
        kcal: sum(parsed.breakfast ?? []) + sum(parsed.lunch ?? []) + sum(parsed.dinner ?? []) + sum(parsed.snacks ?? []),
      });
    } catch {
      result.push({ date: d, kcal: 0 });
    }
  }
  return result;
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

interface WorkoutEntry {
  date: string;
  type: string;
  durationSec: number;
  caloriesBurned: number;
  startedAt: number;
}

function readWorkoutHistoryLast3Days(workoutHistoryKey: string): WorkoutEntry[] {
  try {
    const raw = localStorage.getItem(workoutHistoryKey);
    if (!raw) return [];
    const list = JSON.parse(raw) as WorkoutEntry[];
    if (!Array.isArray(list)) return [];
    const today = getTodayDateString();
    const day1 = getDateDaysAgo(1);
    const day2 = getDateDaysAgo(2);
    const allowed = [today, day1, day2];
    return list.filter((e) => allowed.includes(e.date)).slice(0, 20);
  } catch {
    return [];
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

/** Body state label from 0–100 score */
function getBodyStateLabel(score: number): string {
  if (score >= 85) return "Оптимальное";
  if (score >= 70) return "Хорошее";
  if (score >= 55) return "Умеренное";
  if (score >= 40) return "Низкое";
  return "Критично";
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

  const { metrics, latestLab, todayKcal, kcalLast3, workoutLast3, todayWorkout } = useMemo(() => {
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
      kcalLast3: readKcalLast3Days(keys.nutrition),
      workoutLast3: readWorkoutHistoryLast3Days(keys.workout_history),
      todayWorkout: readTodayWorkout(keys.workout_history),
    };
  }, [user?.height, user?.weight, storageKeys]);

  const energyScore = metrics.energyScore;
  const stressScore = metrics.stressScore;
  const recoveryScore = metrics.recoveryScore;
  const testosteroneValue = latestLab?.testosterone;
  const testosteroneIndex = metrics.testosteroneIndex;

  const { energyPercent, hormonesPercent, strengthPercent } = useMemo(() => {
    const intensity = workoutIntensityFromToday(todayWorkout.durationSec, todayWorkout.caloriesBurned);
    const workoutBalance = clamp(100 - Math.abs(5 - intensity) * 12, 0, 100);
    return {
      energyPercent: clamp(energyScore, 0, 100),
      hormonesPercent: testosteroneIndex != null ? clamp(testosteroneIndex, 0, 100) : clamp(Math.round((energyScore + recoveryScore) / 2), 0, 100),
      strengthPercent: clamp(Math.round(recoveryScore * 0.55 + workoutBalance * 0.45), 0, 100),
    };
  }, [energyScore, recoveryScore, testosteroneIndex, todayWorkout.durationSec, todayWorkout.caloriesBurned]);

  const openMetricSheet = (detail: MetricDetail) => {
    setSelectedMetric(detail);
    setMetricSheetOpen(true);
  };
  const testosteroneStatusKey = testosteroneValue != null ? getTestosteroneStatus(testosteroneValue) : null;

  const { bodyStateScore, bodyStateLabel } = useMemo(() => {
    const recommended = user?.height && user?.weight ? getRecommendedKcal(user.weight, user.height) : null;
    const targetKcal = recommended?.target ?? 2000;
    const intensity = workoutIntensityFromToday(todayWorkout.durationSec, todayWorkout.caloriesBurned);

    const sleepScore = clamp((SLEEP_AVG_HOURS / 8) * 100, 0, 100);
    const recoveryScoreNorm = clamp(metrics.recoveryScore, 0, 100);
    const trainingBalanceScore = clamp(100 - Math.abs(5 - intensity) * 12, 0, 100);
    const calorieRatio = targetKcal > 0 ? todayKcal / targetKcal : 1;
    const calorieBalanceScore = clamp(100 - Math.abs(1 - calorieRatio) * 80, 0, 100);
    const stressInverseScore = clamp(100 - metrics.stressScore, 0, 100);
    const pulseBpm = 62;
    const pulseScore = clamp(100 - Math.abs(72 - pulseBpm) * 3, 0, 100);
    const oxygenPct = 98;
    const oxygenScore = clamp(oxygenPct, 0, 100);

    const hasTestosterone = testosteroneValue != null;
    let testosteroneScore = 50;
    if (hasTestosterone && testosteroneStatusKey) {
      testosteroneScore = testosteroneStatusKey === "normal" ? 85 : testosteroneStatusKey === "high" ? 70 : 40;
    }

    let raw: number;
    if (hasTestosterone) {
      raw =
        sleepScore * 0.2 +
        recoveryScoreNorm * 0.15 +
        trainingBalanceScore * 0.15 +
        calorieBalanceScore * 0.15 +
        stressInverseScore * 0.15 +
        testosteroneScore * 0.1 +
        pulseScore * 0.05 +
        oxygenScore * 0.05;
    } else {
      const sumWeights = 0.2 + 0.15 + 0.15 + 0.15 + 0.15 + 0.05 + 0.05;
      raw =
        (sleepScore * 0.2 + recoveryScoreNorm * 0.15 + trainingBalanceScore * 0.15 +
          calorieBalanceScore * 0.15 + stressInverseScore * 0.15 + pulseScore * 0.05 + oxygenScore * 0.05) /
        sumWeights;
    }
    const bodyStateScore = clamp(Math.round(raw), 0, 100);
    return { bodyStateScore, bodyStateLabel: getBodyStateLabel(bodyStateScore) };
  }, [
    user?.height,
    user?.weight,
    metrics.recoveryScore,
    metrics.stressScore,
    todayKcal,
    todayWorkout,
    testosteroneValue,
    testosteroneStatusKey,
  ]);

  return (
    <motion.div
      className="px-5 pt-12 pb-24"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header: greeting + name */}
      <motion.div variants={item} className="mb-4 flex flex-col items-center text-center">
        <p className="text-sm text-muted-foreground">{getGreetingByTime()}</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">{displayName}</h1>
      </motion.div>

      {/* Body state orb */}
      <motion.div variants={item} className="mt-4 mb-4 flex justify-center overflow-visible">
        <div className="relative mx-auto flex w-full max-w-[420px] items-center justify-center overflow-visible">
          <HealthOrb score={bodyStateScore} />
        </div>
      </motion.div>

      {/* Block 2 — Метрики */}
      <motion.div variants={item} className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("metrics.title")}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <EnergyCard
            percent={energyPercent}
            onClick={() =>
              openMetricSheet({
                key: "energy",
                title: t("metrics.energy"),
                percent: energyPercent,
              })
            }
          />
          <HormonesCard
            percent={hormonesPercent}
            onClick={() =>
              openMetricSheet({
                key: "hormones",
                title: t("metrics.hormones"),
                percent: hormonesPercent,
              })
            }
          />
          <StrengthCard
            percent={strengthPercent}
            onClick={() =>
              openMetricSheet({
                key: "strength",
                title: t("metrics.strength"),
                percent: strengthPercent,
              })
            }
          />
        </div>
      </motion.div>

      {/* Block 4 — Системы ресурса */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("systems.title")}
        </h2>
        <ResourceSystems
          hormonalPercent={hormonesPercent}
          nervousPercent={Math.round((energyPercent + Math.max(0, 100 - stressScore)) / 2)}
          physicalPercent={strengthPercent}
          metabolicPercent={recoveryScore}
        />
      </motion.div>

      {/* Metric detail sheet */}
      <MetricDetailSheet
        open={metricSheetOpen}
        onOpenChange={setMetricSheetOpen}
        detail={selectedMetric}
      />
    </motion.div>
  );
};

export default ControlCenter;
