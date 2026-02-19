import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getStorageKey } from "@/lib/userStorage";
import { useTranslation } from "react-i18next";
import { Camera, PenLine } from "lucide-react";
import { FloatingAddWidget } from "@/components/center/FloatingAddWidget";

const WATER_GOAL_ML = 2500;

const BODY_PARTS = ["chest", "back", "legs", "shoulders", "arms", "abs"] as const;
const CARDIO_TYPES = ["run", "swim", "bike", "hiit", "other"] as const;

const CENTER_TABS = ["Питание", "Тренировки"] as const;
type CenterTab = (typeof CENTER_TABS)[number];

const WORKOUT_CARDIO_MAP: Record<string, string> = {
  run: "Бег",
  swim: "Плавание",
  bike: "Велосипед",
  hiit: "HIIT",
  other: "Другое",
};

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

interface NutritionHistoryDay {
  date: string;
  totalKcal: number;
}

function loadNutritionHistory(key: string): NutritionHistoryDay[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNutritionHistory(key: string, history: NutritionHistoryDay[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(history.slice(-60)));
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
  bodyParts?: string[];
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
      nutrition_history: getStorageKey(user.id, "nutrition_history"),
      water: getStorageKey(user.id, "water"),
      workout_history: getStorageKey(user.id, "workout_history"),
      workouts: getStorageKey(user.id, "workouts"),
    };
  }, [user?.id]);

  const [centerTab, setCenterTab] = useState<CenterTab>("Питание");
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

  const [workoutMode, setWorkoutMode] = useState<"strength" | "cardio">("strength");
  const [selectedBodyParts, setSelectedBodyParts] = useState<Set<string>>(new Set());
  const [cardioType, setCardioType] = useState<string>("run");
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
  const [nutritionAddMethod, setNutritionAddMethod] = useState<"voice" | "photo" | "manual" | null>(null);
  const [workoutAddMethod, setWorkoutAddMethod] = useState<"voice" | "text" | null>(null);
  const [nutritionHistory, setNutritionHistory] = useState<NutritionHistoryDay[]>([]);
  const [workoutPlanModalOpen, setWorkoutPlanModalOpen] = useState(false);

  useEffect(() => {
    if (!storageKeys) return;
    setNutrition(loadNutrition(storageKeys.nutrition));
    setWater(loadWaterState(storageKeys.water));
    setWorkoutHistory(loadWorkoutHistory(storageKeys.workout_history));
    setNutritionHistory(loadNutritionHistory(storageKeys.nutrition_history));
  }, [storageKeys]);

  useEffect(() => {
    if (!storageKeys) return;
    saveNutrition(storageKeys.nutrition, nutrition);
    const sum =
      nutrition.breakfast.reduce((s, i) => s + itemKcal(i), 0) +
      nutrition.lunch.reduce((s, i) => s + itemKcal(i), 0) +
      nutrition.dinner.reduce((s, i) => s + itemKcal(i), 0) +
      nutrition.snacks.reduce((s, i) => s + itemKcal(i), 0);
    if (sum > 0) {
      const hist = loadNutritionHistory(storageKeys.nutrition_history);
      const existing = hist.findIndex((h) => h.date === nutrition.date);
      const entry = { date: nutrition.date, totalKcal: sum };
      const next =
        existing >= 0 ? hist.map((h, i) => (i === existing ? entry : h)) : [entry, ...hist];
      saveNutritionHistory(storageKeys.nutrition_history, next);
      setNutritionHistory(next);
    }
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
    ? getRecommendedKcal(user.height, user.weight)
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

  const canStartStrength = workoutMode === "strength" ? selectedBodyParts.size > 0 : true;
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
    const typeLabel =
      workoutMode === "strength"
        ? `Силовая: ${Array.from(selectedBodyParts).map((id) => t(`center.${id}`)).join(", ") || "—"}`
        : WORKOUT_CARDIO_MAP[cardioType] ?? cardioType;
    const entry: WorkoutHistoryEntry = {
      date: getTodayDateString(),
      type: typeLabel,
      bodyParts: workoutMode === "strength" ? Array.from(selectedBodyParts) : undefined,
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

  const { t } = useTranslation();

  return (
    <motion.div
      className="min-h-screen px-4 py-6 pb-28"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <h1 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Центр</h1>

      {/* Top segmented navigation — только Питание и Тренировки */}
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

      {/* Питание */}
      {centerTab === "Питание" && (
        <>
      {/* 1. План питания — заблюрен */}
      <motion.section variants={itemAnim} className="mb-6">
        <Card className="border border-border bg-card shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 backdrop-blur-md bg-background/60 z-10 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center px-4">
              {t("center.nutritionPlanBlur")}
            </p>
          </div>
          <CardContent className="p-6 blur-sm select-none pointer-events-none">
            <p className="text-xs text-muted-foreground">Завтрак · Обед · Ужин</p>
            <p className="mt-2 text-lg font-medium">—</p>
          </CardContent>
        </Card>
      </motion.section>

      {/* 2. Сегодня */}
      <motion.section variants={itemAnim} className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("center.todaySection")}
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
                      setNutritionAddMethod(null);
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
              {t("center.caloriesPerDay")}: {totalKcal} {t("center.kcal")}
              {(totalProtein > 0 || totalFat > 0 || totalCarbs > 0) && (
                <> · Б {totalProtein} г · Ж {totalFat} г · У {totalCarbs} г</>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* 3. История питания */}
      <motion.section variants={itemAnim} className="mb-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("center.history")}
        </h2>
        <Card className="border border-border shadow-sm">
          <CardContent className="p-4">
            {nutritionHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет записей</p>
            ) : (
              <ul className="space-y-2">
                {nutritionHistory.slice(0, 14).map((h) => (
                  <li key={h.date} className="flex justify-between text-sm">
                    <span className="text-foreground">{h.date}</span>
                    <span className="font-medium text-foreground">{h.totalKcal} {t("center.kcal")}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.section>

      <motion.section variants={itemAnim} className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Droplets className="h-3.5 w-3.5" />
          {t("center.water")}
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
      <motion.section variants={itemAnim} className="space-y-6">
        {/* 1. Запуск — Силовые */}
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("center.strength")}
          </h2>
          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              {!workoutActive ? (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {BODY_PARTS.map((id) => {
                      const selected = selectedBodyParts.has(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setWorkoutMode("strength");
                            setSelectedBodyParts((prev) => {
                              const next = new Set(prev);
                              if (selected) next.delete(id);
                              else next.add(id);
                              return next;
                            });
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted/50"
                          }`}
                        >
                          {t(`center.${id}` as "center.chest")}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => { setWorkoutMode("strength"); startWorkout(); }}
                    disabled={selectedBodyParts.size === 0}
                  >
                    <Play className="h-4 w-4" />
                    {t("center.startWorkout")}
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
                      <p className="text-[10px] text-muted-foreground">{t("center.pulse")}</p>
                      <p className="text-sm font-semibold text-foreground">{workoutHeartRate} {t("center.bpm")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <Flame className="h-4 w-4 text-status-amber" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t("center.calories")}</p>
                      <p className="text-sm font-semibold text-foreground">~{workoutCalories} {t("center.kcal")}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={pauseWorkout}>
                    {workoutPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {workoutPaused ? t("common.continue") : t("center.pause")}
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2" onClick={stopWorkout}>
                    <Square className="h-4 w-4" />
                    {t("center.stop")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        {/* 2. Кардио и прочие */}
        {!workoutActive && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Кардио
          </h2>
          <div className="flex flex-wrap gap-2">
            {CARDIO_TYPES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setWorkoutMode("cardio");
                  setCardioType(id);
                  startWorkout();
                }}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                {WORKOUT_CARDIO_MAP[id]}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* 3. План тренировок */}
        {!workoutActive && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("center.workoutPlan")}
          </h2>
          <Button variant="outline" className="w-full" onClick={() => setWorkoutPlanModalOpen(true)}>
            {t("center.addPlan")}
          </Button>
        </div>
        )}

        {/* 4. История тренировок */}
        {workoutHistory.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("center.workoutHistory")}
            </p>
            <ul className="space-y-1.5">
              {workoutHistory.slice(0, 7).map((h, i) => (
                <li
                  key={`${h.date}-${h.startedAt}-${i}`}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{h.type}</span>
                  <span className="text-muted-foreground">
                    {Math.floor(h.durationSec / 60)} {t("center.min")} · ~{h.caloriesBurned} {t("center.kcal")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>
      )}

      {/* Floating add widget — Nutrition или Тренировки */}
      {centerTab === "Питание" && (
        <div className="fixed bottom-24 right-4 z-40">
          <FloatingAddWidget
            mainIcon={<UtensilsCrossed className="h-6 w-6" />}
            options={[
              { id: "voice", icon: <Mic className="h-5 w-5" />, label: t("center.voice") },
              { id: "photo", icon: <Camera className="h-5 w-5" />, label: t("center.photo") },
              { id: "manual", icon: <PenLine className="h-5 w-5" />, label: t("center.manual") },
            ]}
            onSelect={(id) => {
              if (id === "voice") toggleVoice();
              else if (id === "manual") {
                setAddModal({ meal: "breakfast" });
                setNewName("");
                setNewGrams("");
                setNewKcalPer100("");
                setNewManualKcal("");
                setNewProtein("");
                setNewFat("");
                setNewCarbs("");
              }
              setNutritionAddMethod(id as "voice" | "photo" | "manual");
            }}
            ariaLabel="Добавить приём пищи"
          />
        </div>
      )}
      {centerTab === "Тренировки" && (
        <div className="fixed bottom-24 right-4 z-40">
          <FloatingAddWidget
            mainIcon={<Dumbbell className="h-6 w-6" />}
            options={[
              { id: "voice", icon: <Mic className="h-5 w-5" />, label: t("center.voice") },
              { id: "text", icon: <PenLine className="h-5 w-5" />, label: t("center.text") },
            ]}
            onSelect={(id) => {
              if (id === "voice") toggleVoice();
              setWorkoutAddMethod(id as "voice" | "text");
            }}
            ariaLabel="Добавить тренировку"
          />
        </div>
      )}

      {/* Workout plan modal */}
      <Dialog open={workoutPlanModalOpen} onOpenChange={setWorkoutPlanModalOpen}>
        <DialogContent className="max-w-[340px] border border-border bg-card p-5">
          <DialogHeader>
            <DialogTitle className="text-base">{t("center.addPlan")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Скоро: форма добавления плана (дата, тип, части тела, продолжительность, цель, комментарий).
          </p>
          <Button onClick={() => setWorkoutPlanModalOpen(false)}>{t("common.close")}</Button>
        </DialogContent>
      </Dialog>

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
            <DialogTitle className="text-base">Добавить приём пищи</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Тип приёма</Label>
              <Select
                value={addModal?.meal ?? "breakfast"}
                onValueChange={(v) => addModal && setAddModal({ meal: v as typeof addModal.meal })}
              >
                <SelectTrigger className="mt-1 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {MEAL_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
