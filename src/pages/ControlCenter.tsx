import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Heart,
  BedDouble,
  Activity,
  Zap,
  UtensilsCrossed,
  Dumbbell,
  Dna,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getGreetingByTime } from "@/lib/greeting";
import { getRecommendedKcal } from "@/lib/health";
import { computeHealthMetrics } from "@/lib/healthEngine";
import { getLatestLab, getTestosteroneStatus } from "@/lib/labs";
import { getStorageKey } from "@/lib/userStorage";
import HealthOrb from "@/components/control/HealthOrb";
import { Card, CardContent } from "@/components/ui/card";

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

function getMetricStatus(value: number, highIsGood: boolean): "Низкий" | "Умеренный" | "Высокий" | "Оптимальный" {
  if (highIsGood) {
    if (value >= 76) return "Оптимальный";
    if (value >= 51) return "Высокий";
    if (value >= 26) return "Умеренный";
    return "Низкий";
  }
  if (value <= 25) return "Оптимальный";
  if (value <= 50) return "Низкий";
  if (value <= 75) return "Умеренный";
  return "Высокий";
}

const TESTOSTERON_STATUS_LABELS: Record<"low" | "normal" | "high", string> = {
  low: "Ниже нормы",
  normal: "Норма",
  high: "Выше нормы",
};

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
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || "Пользователь";
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

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
  const energyStatus = getMetricStatus(energyScore, true);
  const stressStatus = getMetricStatus(stressScore, false);
  const testosteroneValue = latestLab?.testosterone;
  const testosteroneStatusKey = testosteroneValue != null ? getTestosteroneStatus(testosteroneValue) : null;
  const testosteroneStatusLabel = testosteroneStatusKey != null ? TESTOSTERON_STATUS_LABELS[testosteroneStatusKey] : null;

  const stepsToday = 8240;

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

  const factors = useMemo(
    () => [
      {
        id: "sleep",
        icon: BedDouble,
        label: "Сон",
        value: "7ч 42м",
        colorClass: "bg-status-green/15 text-status-green",
        expandedContent: (
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            {sleepLast3Days.map((s) => (
              <li key={s.day}>
                {s.day}: {s.hours} ч
              </li>
            ))}
          </ul>
        ),
      },
      {
        id: "recovery",
        icon: Zap,
        label: "Восстановление",
        value: `${recoveryScore}`,
        colorClass: "bg-status-green/15 text-status-green",
        expandedContent: (
          <p className="mt-2 text-xs text-muted-foreground">
            На основе сна и тренировочной нагрузки (мок).
          </p>
        ),
      },
      {
        id: "workout",
        icon: Dumbbell,
        label: "Тренировки",
        value: `${Math.floor(todayWorkout.durationSec / 60)} мин`,
        colorClass: "bg-status-amber/15 text-status-amber",
        expandedContent: (
          <div className="mt-2 space-y-2 text-xs">
            <p className="text-muted-foreground">Тренировки за 3 дня:</p>
            <ul className="space-y-1">
              {workoutLast3.length === 0 ? (
                <li className="text-muted-foreground">Нет записей</li>
              ) : (
                workoutLast3.slice(0, 5).map((w, i) => (
                  <li key={`${w.date}-${w.startedAt}-${i}`} className="text-foreground">
                    {w.type} — {Math.floor(w.durationSec / 60)} мин, ~{w.caloriesBurned} ккал
                  </li>
                ))
              )}
            </ul>
            <p className="text-muted-foreground">Шаги сегодня: {stepsToday}</p>
          </div>
        ),
      },
      {
        id: "kcal",
        icon: UtensilsCrossed,
        label: "Ккал",
        value: `${todayKcal}`,
        colorClass: "bg-primary/15 text-primary",
        expandedContent: (
          <div className="mt-2 space-y-1 text-xs">
            <p className="text-muted-foreground">Ккал за 3 дня:</p>
            <ul className="space-y-0.5">
              {kcalLast3.map((k) => (
                <li key={k.date} className="text-foreground">
                  {k.date}: {k.kcal} ккал
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        id: "testosterone",
        icon: Dna,
        label: "Тестостерон",
        value: testosteroneValue != null ? `${testosteroneValue} нг/дл` : "—",
        colorClass: "bg-status-green/15 text-status-green",
        expandedContent: (
          <p className="mt-2 text-xs text-muted-foreground">
            {testosteroneValue == null
              ? "Добавьте результат анализа в разделе Анализы"
              : `Статус: ${testosteroneStatusLabel ?? "—"}`}
          </p>
        ),
      },
      {
        id: "stress",
        icon: AlertCircle,
        label: "Стресс",
        value: `${stressScore}`,
        colorClass: "bg-status-amber/15 text-status-amber",
        expandedContent: (
          <p className="mt-2 text-xs text-muted-foreground">
            Уровень кортизола/стресса. {stressStatus}.
          </p>
        ),
      },
    ],
    [
      recoveryScore,
      todayWorkout.durationSec,
      workoutLast3,
      todayKcal,
      kcalLast3,
      testosteroneValue,
      testosteroneStatusLabel,
      stressScore,
      stressStatus,
    ]
  );

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
          Метрики
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Card className="flex w-full flex-col items-center justify-center rounded-2xl bg-card">
            <CardContent className="flex flex-col items-center justify-center px-4 py-6">
              <Heart className="mb-3 h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-semibold text-foreground">62</span>
              <span className="mt-1 text-sm text-muted-foreground">Пульс</span>
            </CardContent>
          </Card>
          <Card className="flex w-full flex-col items-center justify-center rounded-2xl bg-card">
            <CardContent className="flex flex-col items-center justify-center px-4 py-6">
              <Activity className="mb-3 h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-semibold text-foreground">120/80</span>
              <span className="mt-1 text-sm text-muted-foreground">Давление</span>
            </CardContent>
          </Card>
          <Card className="flex w-full flex-col items-center justify-center rounded-2xl bg-card">
            <CardContent className="flex flex-col items-center justify-center px-4 py-6">
              <BedDouble className="mb-3 h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-semibold text-foreground">98%</span>
              <span className="mt-1 text-sm text-muted-foreground">Кислород в крови</span>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Block 3 — Факторы влияния */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Факторы влияния
        </h2>
        <div className="space-y-2">
          {factors.map((f) => {
            const isExpanded = expandedFactor === f.id;
            return (
              <Card
                key={f.id}
                className="border border-border bg-card shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-3 text-left"
                  onClick={() => setExpandedFactor(isExpanded ? null : f.id)}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.colorClass}`}
                  >
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-foreground">{f.label}</span>
                    <span className="ml-2 text-sm font-bold text-foreground">{f.value}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border bg-muted/30 px-3 pb-3 pt-1"
                    >
                      {f.expandedContent}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ControlCenter;
