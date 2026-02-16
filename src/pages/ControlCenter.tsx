import { useMemo } from "react";
import {
  Heart,
  BedDouble,
  Activity,
  Brain,
  Sun,
  Dumbbell,
  Zap,
  FlaskConical,
  Battery,
  AlertCircle,
  Dna,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getGreetingByTime } from "@/lib/greeting";
import { getRecommendedKcal } from "@/lib/health";
import { computeHealthMetrics } from "@/lib/healthEngine";
import { getLatestLab, getTestosteroneStatus } from "@/lib/labs";
import ReadinessRing from "@/components/control/ReadinessRing";
import { Card, CardContent } from "@/components/ui/card";

const NUTRITION_KEY = "reformator_bio_nutrition";
const WATER_KEY = "reformator_bio_water";
const WORKOUT_HISTORY_KEY = "reformator_bio_workout_history";

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readTodayKcal(): number {
  try {
    const raw = localStorage.getItem(NUTRITION_KEY);
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

function readTodayWater(): { current: number; goal: number } {
  try {
    const raw = localStorage.getItem(WATER_KEY);
    const today = getTodayDateString();
    if (!raw) return { current: 0, goal: 2500 };
    const parsed = JSON.parse(raw);
    if (parsed.lastUpdatedDate !== today) return { current: 0, goal: Number(parsed.goal) || 2500 };
    return { current: Number(parsed.current) || 0, goal: Number(parsed.goal) || 2500 };
  } catch {
    return { current: 0, goal: 2500 };
  }
}

function readTodayWorkout(): { durationSec: number; caloriesBurned: number } {
  try {
    const raw = localStorage.getItem(WORKOUT_HISTORY_KEY);
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

/** ng/dL → nmol/L for health engine */
function testosteroneNgDlToNmolL(ngDl: number): number {
  return ngDl * 0.0347;
}

/** Derive 0–10 workout intensity from today's duration (sec) and calories burned */
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

const whyFactors = [
  {
    icon: BedDouble,
    label: "Сон",
    value: "7ч 42м",
    status: "Глубокий сон 1.8ч — выше среднего",
    colorClass: "bg-status-green/15 text-status-green",
  },
  {
    icon: Zap,
    label: "Нагрузка",
    value: "12.4",
    status: "Умеренная нагрузка — хороший баланс",
    colorClass: "bg-status-amber/15 text-status-amber",
  },
  {
    icon: FlaskConical,
    label: "Анализы",
    value: "Норма",
    status: "Витамин D немного понижен",
    colorClass: "bg-status-green/15 text-status-green",
  },
];

const otherActions = [
  { icon: Sun, label: "Утренняя рутина", desc: "10 мин растяжка + холодный душ" },
  { icon: Dumbbell, label: "Интенсивная тренировка", desc: "Организм готов к высокой нагрузке" },
];

const quickMetrics = [
  { icon: Heart, label: "Пульс", value: "62", unit: "уд/м", pulse: true },
  { icon: BedDouble, label: "Сон", value: "7ч 42м", unit: "" },
  { icon: Activity, label: "Нагрузка", value: "12.4", unit: "strain" },
  { icon: Brain, label: "Стресс", value: "Низкий", unit: "" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const ControlCenter = () => {
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() || "Пользователь";

  const { metrics, latestLab } = useMemo(() => {
    const todayKcal = readTodayKcal();
    const water = readTodayWater();
    const workout = readTodayWorkout();
    const recommended = user?.height && user?.weight ? getRecommendedKcal(user.weight, user.height) : null;
    const targetKcal = recommended?.target ?? 2000;
    const lab = getLatestLab();

    const testosteroneNmolL =
      lab?.testosterone != null ? testosteroneNgDlToNmolL(lab.testosterone) : undefined;

    const input = {
      sleepHours: 7.5,
      caloriesConsumed: todayKcal,
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
    return { metrics: healthMetrics, latestLab: lab };
  }, [user?.height, user?.weight]);

  const energyScore = metrics.energyScore;
  const stressScore = metrics.stressScore;

  const energyStatus = getMetricStatus(energyScore, true);
  const stressStatus = getMetricStatus(stressScore, false);
  const testosteroneValue = latestLab?.testosterone;
  const testosteroneStatus = testosteroneValue != null ? getTestosteroneStatus(testosteroneValue) : null;

  return (
    <motion.div
      className="px-5 pt-12 pb-24"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="mb-2">
        <p className="text-sm text-muted-foreground">{getGreetingByTime()}</p>
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
      </motion.div>

      <motion.div variants={item} className="flex flex-col items-center py-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Общий статус
        </h2>
        <ReadinessRing score={82} />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Ваш организм хорошо восстановился. Можно увеличить нагрузку.
        </p>
      </motion.div>

      <motion.div variants={item} className="mt-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Факторы влияния
        </h2>
        <div className="space-y-2">
          {whyFactors.slice(0, 2).map((f) => (
            <Card key={f.label} className="border border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.colorClass}`}
                >
                  <f.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-foreground">{f.label}</span>
                    <span className="text-sm font-bold text-foreground">{f.value}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{f.status}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Battery className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-foreground">Энергия</span>
                  <span className="text-sm font-bold text-foreground">{energyScore}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {energyScore > 75
                    ? "Высокий уровень энергии"
                    : energyScore >= 50
                      ? "Стабильное состояние"
                      : energyScore >= 25
                        ? "Сниженный ресурс"
                        : "Требуется восстановление"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-amber/15 text-status-amber">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-foreground">Стресс</span>
                  <span className="text-sm font-bold text-foreground">{stressScore}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {stressScore > 75
                    ? "Высокая нагрузка"
                    : stressScore >= 50
                      ? "Умеренный уровень"
                      : stressScore >= 25
                        ? "Контролируемый стресс"
                        : "Минимальный стресс"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-green/15 text-status-green">
                <Dna className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-foreground">Тестостерон</span>
                  <span className="text-sm font-bold text-foreground">
                    {testosteroneValue != null ? `${testosteroneValue} нг/дл` : "Нет данных"}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {testosteroneValue == null
                    ? "Добавьте результат анализа в разделе Анализы"
                    : testosteroneValue < 300
                      ? "Понижен — влияет на энергию"
                      : testosteroneValue > 900
                        ? "Повышенный уровень"
                        : "В пределах нормы"}
                </p>
              </div>
            </CardContent>
          </Card>
          {whyFactors.slice(2, 3).map((f) => (
            <Card key={f.label} className="border border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-3 p-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.colorClass}`}
                >
                  <f.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-foreground">{f.label}</span>
                    <span className="text-sm font-bold text-foreground">{f.value}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{f.status}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Что важно сегодня
        </h2>
        <div className="space-y-2">
          {otherActions.map((a) => (
            <Card
              key={a.label}
              className="cursor-pointer border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <a.icon className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground">{a.label}</span>
                  <p className="truncate text-xs text-muted-foreground">{a.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-6 mb-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Быстрые метрики
        </h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {quickMetrics.map((m) => (
            <Card key={m.label} className="min-w-[110px] shrink-0 border border-border bg-card shadow-sm">
              <CardContent className="flex flex-col items-center gap-1 p-3">
                <div className="relative">
                  <m.icon className="h-4 w-4 text-primary" />
                  {m.pulse && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-status-red" />
                  )}
                </div>
                <span className="text-lg font-bold text-foreground">{m.value}</span>
                <span className="text-[10px] text-muted-foreground">
                  {m.unit ? m.unit : m.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ControlCenter;
