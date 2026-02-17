import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Dumbbell,
  Play,
  Pause,
  Square,
  Heart,
  Flame,
  Droplets,
  Mic,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { getRecommendedKcal, getMacros } from "@/lib/health";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { getStorageKey } from "@/lib/userStorage";

const WATER_GOAL_ML = 2500;

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
const analyticsPeriods = ["День", "Неделя", "Месяц"] as const;
const CENTER_TABS = ["Обзор", "Питание", "Тренировки"] as const;
type CenterTab = (typeof CENTER_TABS)[number];

const WORKOUT_TYPES = [
  { id: "gym", label: "Тренировка в зале", emoji: "🏋" },
  { id: "run", label: "Бег", emoji: "🏃" },
  { id: "swim", label: "Плавание", emoji: "🏊" },
  { id: "bike", label: "Велосипед", emoji: "🚴" },
  { id: "boxing", label: "Бокс", emoji: "🥊" },
  { id: "yoga", label: "Йога", emoji: "🧘" },
  { id: "hiking", label: "Хайкинг", emoji: "🏔" },
] as const;

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface NutritionItem {
  name: string;
  grams: number;
  kcalPer100?: number;
  manualKcal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

function itemKcal(item: NutritionItem): number {
  if (item.manualKcal != null && item.manualKcal > 0) return item.manualKcal;
  if (item.kcalPer100 != null && item.grams > 0) return Math.round((item.grams / 100) * item.kcalPer100);
  return 0;
}

interface WaterState {
  current: number;
  goal: number;
  lastUpdatedDate: string;
}

function loadWaterState(waterKey: string): WaterState {
  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(waterKey);
    if (!raw) return { current: 0, goal: WATER_GOAL_ML, lastUpdatedDate: today };
    const parsed = JSON.parse(raw);
    const state = {
      current: Number(parsed.current) || 0,
      goal: Number(parsed.goal) || WATER_GOAL_ML,
      lastUpdatedDate: parsed.lastUpdatedDate || today,
    };
    if (state.lastUpdatedDate !== today) return { ...state, current: 0, lastUpdatedDate: today };
    return state;
  } catch {
    return { current: 0, goal: WATER_GOAL_ML, lastUpdatedDate: getTodayDateString() };
  }
}

function saveWaterState(waterKey: string, state: WaterState): void {
  try {
    localStorage.setItem(waterKey, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export interface NutritionDay {
  date: string;
  breakfast: NutritionItem[];
  lunch: NutritionItem[];
  dinner: NutritionItem[];
  snacks: NutritionItem[];
}

function loadNutrition(nutritionKey: string): NutritionDay {
  const today = getTodayDateString();
  try {
    const raw = localStorage.getItem(nutritionKey);
    if (!raw) return { date: today, breakfast: [], lunch: [], dinner: [], snacks: [] };
    const parsed = JSON.parse(raw) as NutritionDay;
    if (parsed.date !== today) {
      return { date: today, breakfast: [], lunch: [], dinner: [], snacks: [] };
    }
    return {
      date: parsed.date,
      breakfast: parsed.breakfast ?? [],
      lunch: parsed.lunch ?? [],
      dinner: parsed.dinner ?? [],
      snacks: parsed.snacks ?? [],
    };
  } catch {
    return { date: today, breakfast: [], lunch: [], dinner: [], snacks: [] };
  }
}

function saveNutrition(nutritionKey: string, data: NutritionDay): void {
  try {
    localStorage.setItem(nutritionKey, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const MEAL_KEYS = ["breakfast", "lunch", "dinner", "snacks"] as const;
const MEAL_LABELS: Record<(typeof MEAL_KEYS)[number], string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snacks: "Перекусы",
};

interface WorkoutHistoryEntry {
  date: string;
  type: string;
  durationSec: number;
  caloriesBurned: number;
  startedAt: number;
}

function loadWorkoutHistory(workoutHistoryKey: string): WorkoutHistoryEntry[] {
  try {
    const raw = localStorage.getItem(workoutHistoryKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWorkoutHistory(workoutHistoryKey: string, entries: WorkoutHistoryEntry[]): void {
  try {
    localStorage.setItem(workoutHistoryKey, JSON.stringify(entries.slice(-50)));
  } catch {
    // ignore
  }
}

const defaultNutrition = (): NutritionDay => ({
  date: getTodayDateString(),
  breakfast: [],
  lunch: [],
  dinner: [],
  snacks: [],
});
const defaultWater = (): WaterState => ({
  current: 0,
  goal: WATER_GOAL_ML,
  lastUpdatedDate: getTodayDateString(),
});

export default function Center() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const storageKeys = useMemo(() => {
    if (!user?.id) return null;
    return {
      nutrition: getStorageKey(user.id, "nutrition"),
      water: getStorageKey(user.id, "water"),
      workout_history: getStorageKey(user.id, "workout_history"),
      workouts: getStorageKey(user.id, "workouts"),
    };
  }, [user?.id]);

  const [centerTab, setCenterTab] = useState<CenterTab>("Обзор");
  const [analyticsPeriod, setAnalyticsPeriod] = useState<(typeof analyticsPeriods)[number]>("Неделя");
  const [nutrition, setNutrition] = useState<NutritionDay>(defaultNutrition);
  const [addModal, setAddModal] = useState<{ meal: (typeof MEAL_KEYS)[number] } | null>(null);
  const [newName, setNewName] = useState("");
  const [newGrams, setNewGrams] = useState("");
  const [newKcalPer100, setNewKcalPer100] = useState("");
  const [newManualKcal, setNewManualKcal] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [newFat, setNewFat] = useState("");
  const [newCarbs, setNewCarbs] = useState("");

  const [water, setWater] = useState<WaterState>(defaultWater);
  const [waterModalOpen, setWaterModalOpen] = useState(false);
  const [waterInputMl, setWaterInputMl] = useState("");

  const [workoutType, setWorkoutType] = useState<string>(WORKOUT_TYPES[0].id);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutPausedAt, setWorkoutPausedAt] = useState<number | null>(null);
  const [workoutTotalPausedMs, setWorkoutTotalPausedMs] = useState(0);
  const [workoutElapsedSec, setWorkoutElapsedSec] = useState(0);
  const [workoutHeartRate, setWorkoutHeartRate] = useState(0);
  const [workoutCalories, setWorkoutCalories] = useState(0);

  const [voiceListening, setVoiceListening] = useState(false);

  useEffect(() => {
    if (!storageKeys) return;
    setNutrition(loadNutrition(storageKeys.nutrition));
    setWater(loadWaterState(storageKeys.water));
    setWorkoutHistory(loadWorkoutHistory(storageKeys.workout_history));
  }, [storageKeys]);

  useEffect(() => {
    if (storageKeys) saveNutrition(storageKeys.nutrition, nutrition);
  }, [nutrition, storageKeys]);

  useEffect(() => {
    if (storageKeys) saveWaterState(storageKeys.water, water);
  }, [water, storageKeys]);

  const totalKcal =
    nutrition.breakfast.reduce((s, i) => s + itemKcal(i), 0) +
    nutrition.lunch.reduce((s, i) => s + itemKcal(i), 0) +
    nutrition.dinner.reduce((s, i) => s + itemKcal(i), 0) +
    nutrition.snacks.reduce((s, i) => s + itemKcal(i), 0);

  const totalProtein = [
    ...nutrition.breakfast,
    ...nutrition.lunch,
    ...nutrition.dinner,
    ...nutrition.snacks,
  ].reduce((s, i) => s + (i.protein ?? 0), 0);
  const totalFat = [
    ...nutrition.breakfast,
    ...nutrition.lunch,
    ...nutrition.dinner,
    ...nutrition.snacks,
  ].reduce((s, i) => s + (i.fat ?? 0), 0);
  const totalCarbs = [
    ...nutrition.breakfast,
    ...nutrition.lunch,
    ...nutrition.dinner,
    ...nutrition.snacks,
  ].reduce((s, i) => s + (i.carbs ?? 0), 0);

  const recommended = user?.height && user?.weight
    ? getRecommendedKcal(user.weight, user.height)
    : null;
  const macros =
    user?.weight && user?.goal && recommended
      ? getMacros(user.goal, user.weight, recommended.target)
      : null;
  const overKcal = recommended && totalKcal > recommended.target ? totalKcal - recommended.target : 0;

  const addItem = useCallback(() => {
    if (!addModal || !newName.trim()) return;
    const meal = addModal.meal;
    const grams = newGrams.trim() ? Math.max(0, Number(newGrams) || 0) : 0;
    const kcalPer100 = newKcalPer100.trim() ? Math.max(0, Number(newKcalPer100) || 0) : undefined;
    const manualKcal = newManualKcal.trim() ? Math.max(0, Number(newManualKcal) || 0) : undefined;
    const protein = newProtein.trim() ? Math.max(0, Number(newProtein) || 0) : undefined;
    const fat = newFat.trim() ? Math.max(0, Number(newFat) || 0) : undefined;
    const carbs = newCarbs.trim() ? Math.max(0, Number(newCarbs) || 0) : undefined;
    const item: NutritionItem = {
      name: newName.trim(),
      grams: grams || 0,
      kcalPer100,
      manualKcal,
      protein,
      fat,
      carbs,
    };
    setNutrition((prev) => ({
      ...prev,
      [meal]: [...prev[meal], item],
    }));
    setAddModal(null);
    setNewName("");
    setNewGrams("");
    setNewKcalPer100("");
    setNewManualKcal("");
    setNewProtein("");
    setNewFat("");
    setNewCarbs("");
  }, [addModal, newName, newGrams, newKcalPer100, newManualKcal, newProtein, newFat, newCarbs]);

  const addWater = useCallback((ml: number) => {
    if (ml <= 0 || !Number.isFinite(ml)) return;
    const today = getTodayDateString();
    setWater((prev) => ({
      ...prev,
      current: prev.lastUpdatedDate === today ? prev.current + Math.round(ml) : Math.round(ml),
      lastUpdatedDate: today,
    }));
  }, []);

  const handleWaterSubmit = () => {
    const num = Number(waterInputMl.replace(/,/g, "."));
    if (Number.isNaN(num) || num <= 0) return;
    addWater(num);
    setWaterInputMl("");
    setWaterModalOpen(false);
  };

  const removeItem = useCallback((meal: (typeof MEAL_KEYS)[number], index: number) => {
    setNutrition((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((_, i) => i !== index),
    }));
  }, []);

  // Workout: timer and mock HR
  useEffect(() => {
    if (!workoutActive) return;
    const interval = setInterval(() => {
      if (workoutPaused) return;
      const start = workoutStartTime ?? 0;
      const pausedTotal = workoutTotalPausedMs + (workoutPausedAt ? Date.now() - workoutPausedAt : 0);
      setWorkoutElapsedSec(Math.floor((Date.now() - start - pausedTotal) / 1000));
      setWorkoutHeartRate(90 + Math.floor(Math.random() * 71));
      setWorkoutCalories(Math.floor((Date.now() - start - pausedTotal) / 1000 / 60 * 8));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutActive, workoutPaused, workoutStartTime, workoutPausedAt, workoutTotalPausedMs]);

  const startWorkout = () => {
    setWorkoutActive(true);
    setWorkoutPaused(false);
    setWorkoutStartTime(Date.now());
    setWorkoutPausedAt(null);
    setWorkoutTotalPausedMs(0);
    setWorkoutElapsedSec(0);
    setWorkoutHeartRate(95);
    setWorkoutCalories(0);
  };

  const pauseWorkout = () => {
    if (!workoutPaused) {
      setWorkoutPausedAt(Date.now());
      setWorkoutPaused(true);
    } else {
      setWorkoutTotalPausedMs((prev) => prev + (Date.now() - (workoutPausedAt ?? 0)));
      setWorkoutPausedAt(null);
      setWorkoutPaused(false);
    }
  };

  const stopWorkout = () => {
    const durationSec = workoutElapsedSec;
    const calories = workoutCalories;
    const typeLabel = WORKOUT_TYPES.find((t) => t.id === workoutType)?.label ?? workoutType;
    const entry: WorkoutHistoryEntry = {
      date: getTodayDateString(),
      type: typeLabel,
      durationSec,
      caloriesBurned: calories,
      startedAt: workoutStartTime ?? 0,
    };
    const nextHistory = [entry, ...workoutHistory];
    setWorkoutHistory(nextHistory);
    if (storageKeys) saveWorkoutHistory(storageKeys.workout_history, nextHistory);
    try {
      const workoutKey = storageKeys?.workouts ?? "reformator_bio_workout";
      const raw = localStorage.getItem(workoutKey);
      const data = raw ? JSON.parse(raw) : { sessions: [] };
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      sessions.push({
        date: entry.date,
        startedAt: workoutStartTime,
        endedAt: Date.now(),
        durationSec,
        caloriesBurned: calories,
      });
      localStorage.setItem(workoutKey, JSON.stringify({ ...data, sessions }));
    } catch {
      // ignore
    }
    setWorkoutActive(false);
    setWorkoutPaused(false);
    setWorkoutStartTime(null);
    setWorkoutPausedAt(null);
    setWorkoutTotalPausedMs(0);
    setWorkoutElapsedSec(0);
    setWorkoutHeartRate(0);
    setWorkoutCalories(0);
  };

  const toggleVoice = useCallback(() => {
    if (voiceListening) {
      setVoiceListening(false);
      return;
    }
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "ru-RU";
    rec.continuous = false;
    rec.interimResults = false;
rec.onresult = (e: SpeechRecognitionEvent) => {
  const text = (e.results[0]?.[0]?.transcript ?? "").toLowerCase();

  // ===== ВОДА =====
  const waterMatch = text.match(/(\d+)\s?(мл|миллилитр|миллилитров)/);
  if (waterMatch) {
    const amount = Number(waterMatch[1]);
    if (!Number.isNaN(amount) && amount > 0) {
      addWater(amount);
    }
    return;
  }

  // ===== ЕДА (пример: 200 грамм рис) =====
  const foodMatch = text.match(/(\d+)\s?грамм?\s(.+)/);
  if (foodMatch) {
    const grams = Number(foodMatch[1]);
    const name = foodMatch[2]?.trim();

    if (name && grams > 0) {
      setNutrition((prev) => ({
        ...prev,
        snacks: [
          ...prev.snacks,
          {
            name,
            grams,
          },
        ],
      }));
    }
    return;
  }

  // ===== ТРЕНИРОВКА =====
  if (text.includes("тренировка") || text.includes("начать тренировку")) {
    if (!workoutActive) {
      setWorkoutActive(true);
      setWorkoutStartTime(Date.now());
      setWorkoutPausedAt(null);
      setWorkoutTotalPausedMs(0);
      setWorkoutElapsedSec(0);
      setWorkoutHeartRate(95);
      setWorkoutCalories(0);
    }
    return;
  }
};
    rec.onend = () => setVoiceListening(false);
    rec.start();
    setVoiceListening(true);
  }, [voiceListening, workoutActive]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const itemAnim = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  const waterProgress = water.goal > 0 ? Math.min(100, (water.current / water.goal) * 100) : 0;

  const todayWorkout = useMemo(() => {
    const today = getTodayDateString();
    const entries = workoutHistory.filter((e) => e.date === today);
    return {
      durationSec: entries.reduce((s, e) => s + e.durationSec, 0) + (workoutActive ? workoutElapsedSec : 0),
      caloriesBurned: entries.reduce((s, e) => s + e.caloriesBurned, 0) + (workoutActive ? workoutCalories : 0),
    };
  }, [workoutHistory, workoutActive, workoutElapsedSec, workoutCalories]);

  return (
    <motion.div
      className="min-h-screen px-4 py-6 pb-28"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <h1 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Центр</h1>

      {/* Top segmented navigation */}
      <motion.div variants={itemAnim} className="mb-5 flex gap-1 rounded-xl bg-muted p-1">
        {CENTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setCenterTab(tab)}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all ${
              centerTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      {/* Обзор: analytics by period */}
      {centerTab === "Обзор" && (
        <>
        {/* Highlights row */}
        <motion.div variants={itemAnim} className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {["Сон", "Восстановление", "Тренировка", "Питание", "Гормоны", "Стресс"].map((label) => (
            <button
              key={label}
              type="button"
              className="shrink-0 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </motion.div>
        <motion.section variants={itemAnim} className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Аналитика
          </h2>
          <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
            {analyticsPeriods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAnalyticsPeriod(p)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  analyticsPeriod === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Card className="mb-4 border border-border shadow-sm">
            <CardContent className="p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Калории
              </p>
              <p className="text-lg font-semibold text-foreground">{totalKcal} ккал за день</p>
            </CardContent>
          </Card>
          <Card className="mb-4 border border-border shadow-sm">
            <CardContent className="p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Тренировки
              </p>
              <p className="text-sm text-foreground">
                Сегодня: {Math.floor(todayWorkout.durationSec / 60)} мин, ~{todayWorkout.caloriesBurned} ккал
              </p>
              {workoutHistory.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {workoutHistory.slice(0, 3).map((h, i) => (
                    <li key={`${h.date}-${h.startedAt}-${i}`}>
                      {h.type} — {Math.floor(h.durationSec / 60)} мин
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="mb-4 border border-border shadow-sm">
            <CardContent className="p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Тренды сна
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={sleepData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis hide domain={[5, 9]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="mb-4 border border-border shadow-sm">
            <CardContent className="p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Нагрузка
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={loadData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Line type="monotone" dataKey="load" stroke="hsl(var(--status-amber))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--status-amber))" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="mb-4 border border-border shadow-sm">
            <CardContent className="p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Восстановление
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={recoveryData}>
                  <defs>
                    <linearGradient id="recoveryGradCenter" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--status-green))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--status-green))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis hide domain={[50, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--status-green))" strokeWidth={2} fill="url(#recoveryGradCenter)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.section>
        </>
      )}

      {/* Питание */}
      {centerTab === "Питание" && (
        <>
      <motion.section variants={itemAnim} className="mb-6">
        <Card className="border border-border bg-card shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Калории за день</span>
              <span className="text-lg font-semibold text-foreground">{totalKcal} ккал</span>
            </div>
            {recommended && (
              <p className="mt-1 text-xs text-muted-foreground">{recommended.label}</p>
            )}
            {recommended && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Рекомендуемая норма: {recommended.target} ккал
              </p>
            )}
            {overKcal > 0 && (
              <p className="mt-2 text-xs text-destructive">
                Вы превышаете рекомендуемую норму на {overKcal} ккал. Рекомендуется скорректировать рацион.
              </p>
            )}
          </CardContent>
        </Card>
        {macros && (
          <Card className="mt-2 border border-border bg-card shadow-sm">
            <CardContent className="p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Рекомендуемые БЖУ
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-foreground">Б: {macros.protein} г</span>
                <span className="text-foreground">Ж: {macros.fat} г</span>
                <span className="text-foreground">У: {macros.carbs} г</span>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.section>
      <motion.section variants={itemAnim} className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <UtensilsCrossed className="h-3.5 w-3.5" />
          Питание
        </h2>
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-4 space-y-4">
            {MEAL_KEYS.map((meal) => (
              <div key={meal}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{MEAL_LABELS[meal]}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={() => {
                      setAddModal({ meal });
                      setNewName("");
                      setNewGrams("");
                      setNewKcalPer100("");
                      setNewManualKcal("");
                      setNewProtein("");
                      setNewFat("");
                      setNewCarbs("");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Добавить
                  </Button>
                </div>
                <ul className="space-y-1.5">
                  {nutrition[meal].length === 0 ? (
                    <li className="text-xs text-muted-foreground">—</li>
                  ) : (
                    nutrition[meal].map((it, i) => (
                      <li
                        key={`${it.name}-${i}`}
                        className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-sm"
                      >
                        <span className="text-foreground">{it.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{itemKcal(it)} ккал</span>
                          {(it.protein != null || it.fat != null || it.carbs != null) && (
                            <span className="text-[10px] text-muted-foreground">
                              Б{it.protein ?? 0} Ж{it.fat ?? 0} У{it.carbs ?? 0}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeItem(meal, i)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Удалить"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              Итого: {totalKcal} ккал
              {(totalProtein > 0 || totalFat > 0 || totalCarbs > 0) && (
                <> · Б {totalProtein} г · Ж {totalFat} г · У {totalCarbs} г</>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.section>
      <motion.section variants={itemAnim} className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Droplets className="h-3.5 w-3.5" />
          Вода
        </h2>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {water.current} / {water.goal} мл
                </p>
                <Progress value={waterProgress} className="mt-2 h-2" />
              </div>
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full"
                onClick={() => setWaterModalOpen(true)}
                aria-label="Добавить воду"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>
        </>
      )}

      {/* Тренировки */}
      {centerTab === "Тренировки" && (
      <motion.section variants={itemAnim}>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Dumbbell className="h-3.5 w-3.5" />
          Тренировка
        </h2>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-5">
            {!workoutActive ? (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  {WORKOUT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWorkoutType(t.id)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        workoutType === t.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <span className="mr-1">{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
                <Button className="w-full gap-2" onClick={startWorkout}>
                  <Play className="h-4 w-4" />
                  Начать тренировку
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-2xl font-mono font-semibold text-foreground">
                  {formatTime(workoutElapsedSec)}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <Heart className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Пульс</p>
                      <p className="text-sm font-semibold text-foreground">{workoutHeartRate} уд/мин</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <Flame className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Калории</p>
                      <p className="text-sm font-semibold text-foreground">~{workoutCalories} ккал</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={pauseWorkout}
                  >
                    {workoutPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {workoutPaused ? "Продолжить" : "Пауза"}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={stopWorkout}
                  >
                    <Square className="h-4 w-4" />
                    Стоп
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {workoutHistory.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              История тренировок
            </p>
            <ul className="space-y-1.5">
              {workoutHistory.slice(0, 7).map((h, i) => (
                <li
                  key={`${h.date}-${h.startedAt}-${i}`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{h.type}</span>
                  <span className="text-muted-foreground">
                    {Math.floor(h.durationSec / 60)} мин · ~{h.caloriesBurned} ккал
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>
      )}

      {/* Voice assistant */}
      <button
        type="button"
        onClick={toggleVoice}
        className={`fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
          voiceListening
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:bg-muted"
        }`}
        aria-label="Голосовой ассистент"
      >
        <Mic className="h-6 w-6" />
      </button>

      {/* Water modal */}
      <Dialog open={waterModalOpen} onOpenChange={setWaterModalOpen}>
        <DialogContent className="max-w-[300px] border border-border bg-card p-5">
          <DialogHeader>
            <DialogTitle className="text-base">Добавить воду</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Label className="text-xs">Объём (мл)</Label>
            <Input
              type="number"
              min={1}
              value={waterInputMl}
              onChange={(e) => setWaterInputMl(e.target.value)}
              placeholder="250"
              className="border-border bg-background"
            />
            <Button className="w-full" onClick={handleWaterSubmit}>
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add food modal */}
      <Dialog open={addModal !== null} onOpenChange={(o) => !o && setAddModal(null)}>
        <DialogContent className="max-w-[340px] border border-border bg-card p-5">
          <DialogHeader>
            <DialogTitle className="text-base">
              {addModal ? MEAL_LABELS[addModal.meal] : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Название</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Блюдо или продукт"
                className="mt-1 border-border bg-background"
              />
            </div>
            <div>
              <Label className="text-xs">Граммы</Label>
              <Input
                type="number"
                min={0}
                value={newGrams}
                onChange={(e) => setNewGrams(e.target.value)}
                placeholder="100"
                className="mt-1 border-border bg-background"
              />
            </div>
            <div>
              <Label className="text-xs">Ккал на 100 г (опционально)</Label>
              <Input
                type="number"
                min={0}
                value={newKcalPer100}
                onChange={(e) => setNewKcalPer100(e.target.value)}
                placeholder="120"
                className="mt-1 border-border bg-background"
              />
            </div>
            <div>
              <Label className="text-xs">Или укажите ккал вручную</Label>
              <Input
                type="number"
                min={0}
                value={newManualKcal}
                onChange={(e) => setNewManualKcal(e.target.value)}
                placeholder="150"
                className="mt-1 border-border bg-background"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Белки (г)</Label>
                <Input
                  type="number"
                  min={0}
                  value={newProtein}
                  onChange={(e) => setNewProtein(e.target.value)}
                  placeholder="0"
                  className="mt-1 border-border bg-background"
                />
              </div>
              <div>
                <Label className="text-xs">Жиры (г)</Label>
                <Input
                  type="number"
                  min={0}
                  value={newFat}
                  onChange={(e) => setNewFat(e.target.value)}
                  placeholder="0"
                  className="mt-1 border-border bg-background"
                />
              </div>
              <div>
                <Label className="text-xs">Углеводы (г)</Label>
                <Input
                  type="number"
                  min={0}
                  value={newCarbs}
                  onChange={(e) => setNewCarbs(e.target.value)}
                  placeholder="0"
                  className="mt-1 border-border bg-background"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Ккал = (граммы / 100) × ккал на 100 г. Либо введите ккал вручную. БЖУ — по желанию.
            </p>
            <Button className="w-full" onClick={addItem} disabled={!newName.trim()}>
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
