import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Clock,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  Heart,
  Search,
  X,
  Minus,
  Dumbbell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getStorageKey } from "@/lib/userStorage";
import { useTranslation } from "react-i18next";
import foodDatabase from "@/data/foodDatabase.json";
import FullscreenModal from "@/components/FullscreenModal";
import { SportHero, MuscleMap, WorkoutProgram, WorkoutCalendar } from "@/components/sport";
import type { MuscleProgress, WeekPlan, WorkoutDay } from "@/components/sport";

interface FoodProduct {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  category: string;
}

const FOOD_PRODUCTS: FoodProduct[] = foodDatabase.products;
const FOOD_CATEGORIES: Record<string, string> = foodDatabase.categories;

const TAB_KEYS = ["nutrition", "sport"] as const;
type Tab = (typeof TAB_KEYS)[number];

const BODY_PARTS = ["chest", "back", "legs", "shoulders", "arms", "abs"] as const;
const CARDIO_TYPES = ["run", "swim", "bike", "hiit", "other"] as const;

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekDays(dayLabels: string[]): { date: Date; dayName: string; dateStr: string; isToday: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  
  const result = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    result.push({
      date,
      dayName: dayLabels[i] || "",
      dateStr: getDateString(date),
      isToday: getDateString(date) === getTodayDateString(),
    });
  }
  
  return result;
}

function calculateBMR(weight: number, height: number, age: number, isMale: boolean): number {
  if (isMale) {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

function getActivityMultiplier(level: string): number {
  switch (level) {
    case "sedentary": return 1.2;
    case "light": return 1.375;
    case "moderate": return 1.55;
    case "active": return 1.725;
    default: return 1.55;
  }
}

export interface FoodEntry {
  id: string;
  product_id: string;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  timestamp: number;
}

interface DayData {
  entries: FoodEntry[];
}

interface WorkoutHistoryEntry {
  date: string;
  type: string;
  durationSec: number;
  caloriesBurned: number;
  startedAt: number;
  bodyParts?: string[];
}

function loadDayData(key: string, dateStr: string): DayData {
  try {
    const raw = localStorage.getItem(`${key}_${dateStr}`);
    if (!raw) return { entries: [] };
    return JSON.parse(raw);
  } catch {
    return { entries: [] };
  }
}

function saveDayData(key: string, dateStr: string, data: DayData): void {
  try {
    localStorage.setItem(`${key}_${dateStr}`, JSON.stringify(data));
  } catch {}
}

function loadWorkoutHistory(key: string): WorkoutHistoryEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function saveWorkoutHistory(key: string, entries: WorkoutHistoryEntry[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(entries.slice(-50)));
  } catch {}
}

function loadWeekPlan(key: string): WeekPlan {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { monday: ["chest"], wednesday: ["back"], friday: ["legs"] };
    return JSON.parse(raw);
  } catch {
    return { monday: ["chest"], wednesday: ["back"], friday: ["legs"] };
  }
}

function saveWeekPlan(key: string, plan: WeekPlan): void {
  try {
    localStorage.setItem(key, JSON.stringify(plan));
  } catch {}
}

function calculateXP(history: WorkoutHistoryEntry[]): number {
  return history.reduce((total, entry) => {
    const isCardio = !entry.bodyParts || entry.bodyParts.length === 0;
    return total + (isCardio ? 70 : 120);
  }, 0);
}

function calculateMuscleProgress(history: WorkoutHistoryEntry[]): MuscleProgress {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = getDateString(weekAgo);
  
  const recentWorkouts = history.filter(w => w.date >= weekAgoStr);
  
  const muscleCount: Record<string, number> = {
    chest: 0,
    back: 0,
    shoulders: 0,
    arms: 0,
    legs: 0,
    abs: 0,
  };
  
  for (const workout of recentWorkouts) {
    if (workout.bodyParts) {
      for (const part of workout.bodyParts) {
        if (muscleCount[part] !== undefined) {
          muscleCount[part]++;
        }
      }
    }
  }
  
  return {
    chest: muscleCount.chest >= 2 ? 100 : muscleCount.chest === 1 ? 50 : 0,
    back: muscleCount.back >= 2 ? 100 : muscleCount.back === 1 ? 50 : 0,
    shoulders: muscleCount.shoulders >= 2 ? 100 : muscleCount.shoulders === 1 ? 50 : 0,
    arms: muscleCount.arms >= 2 ? 100 : muscleCount.arms === 1 ? 50 : 0,
    legs: muscleCount.legs >= 2 ? 100 : muscleCount.legs === 1 ? 50 : 0,
    abs: muscleCount.abs >= 2 ? 100 : muscleCount.abs === 1 ? 50 : 0,
  };
}

function convertHistoryToWorkoutDays(history: WorkoutHistoryEntry[]): WorkoutDay[] {
  const dayMap: Record<string, WorkoutDay> = {};
  
  for (const entry of history) {
    if (!dayMap[entry.date]) {
      dayMap[entry.date] = { date: entry.date, workouts: [] };
    }
    dayMap[entry.date].workouts.push({
      type: entry.type,
      bodyParts: entry.bodyParts,
      durationSec: entry.durationSec,
      caloriesBurned: entry.caloriesBurned,
    });
  }
  
  return Object.values(dayMap);
}

function MacroCircle({ 
  icon: Icon, 
  label, 
  remaining, 
  goal, 
  color,
}: { 
  icon: React.ElementType;
  label: string;
  remaining: number;
  goal: number;
  color: string;
}) {
  const consumed = goal - remaining;
  const progress = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  const isOver = remaining < 0;
  
  const CIRCLE_SIZE = 70;
  const STROKE_WIDTH = 3;
  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(progress, 100) / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        <svg
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
        >
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={STROKE_WIDTH}
            opacity={0.25}
          />
          <motion.circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            fill="none"
            stroke={isOver ? "#EF4444" : color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-6 w-6" style={{ color: isOver ? "#EF4444" : color }} />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{label}</p>
      <p 
        className="text-base font-bold tabular-nums"
        style={{ color: isOver ? "#EF4444" : "hsl(var(--foreground))" }}
      >
        {remaining}г
      </p>
    </div>
  );
}

function CalendarPopup({
  open,
  onClose,
  selectedDate,
  onSelectDate,
  nutritionKey,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  nutritionKey: string | null;
}) {
  const [viewDate, setViewDate] = useState(new Date());
  
  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; calories: number }[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      const d = new Date(year, month, -startDayOfWeek + i + 1);
      const dateStr = getDateString(d);
      const data = nutritionKey ? loadDayData(nutritionKey, dateStr) : { entries: [] };
      const calories = data.entries.reduce((s, e) => s + e.calories, 0);
      days.push({ date: d, dateStr, isCurrentMonth: false, calories });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = getDateString(d);
      const data = nutritionKey ? loadDayData(nutritionKey, dateStr) : { entries: [] };
      const calories = data.entries.reduce((s, e) => s + e.calories, 0);
      days.push({ date: d, dateStr, isCurrentMonth: true, calories });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = getDateString(d);
      const data = nutritionKey ? loadDayData(nutritionKey, dateStr) : { entries: [] };
      const calories = data.entries.reduce((s, e) => s + e.calories, 0);
      days.push({ date: d, dateStr, isCurrentMonth: false, calories });
    }
    
    return days;
  }, [viewDate, nutritionKey]);

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[340px] border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium">
            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
            <div key={d} className="text-center text-[10px] text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const isToday = day.dateStr === getTodayDateString();
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  onSelectDate(day.dateStr);
                  onClose();
                }}
                className={`flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "bg-muted"
                    : day.isCurrentMonth
                    ? "hover:bg-muted/50"
                    : "opacity-40"
                }`}
              >
                <span className="text-xs font-medium">{day.date.getDate()}</span>
                {day.calories > 0 && (
                  <span className={`text-[8px] ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {day.calories}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Center() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const storageKeys = useMemo(() => {
    if (!user?.id) return null;
    return {
      nutrition: getStorageKey(user.id, "nutrition_v2"),
      workout_history: getStorageKey(user.id, "workout_history"),
      week_plan: getStorageKey(user.id, "week_plan"),
    };
  }, [user?.id]);

  const [activeTab, setActiveTab] = useState<Tab>("nutrition");
  const dayLabels = t("center.dayLabels", { returnObjects: true }) as string[];
  const weekDays = useMemo(() => getWeekDays(dayLabels), [dayLabels]);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [dayData, setDayData] = useState<DayData>({ entries: [] });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [grams, setGrams] = useState(100);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({ monday: ["chest"], wednesday: ["back"], friday: ["legs"] });
  const [workoutMode, setWorkoutMode] = useState<"strength" | "cardio">("strength");
  const [selectedBodyParts, setSelectedBodyParts] = useState<Set<string>>(new Set());
  const [cardioType, setCardioType] = useState<string>("run");
  const [workoutActive, setWorkoutActive] = useState(false);
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [workoutPausedAt, setWorkoutPausedAt] = useState<number | null>(null);
  const [workoutTotalPausedMs, setWorkoutTotalPausedMs] = useState(0);
  const [workoutElapsedSec, setWorkoutElapsedSec] = useState(0);
  const [workoutHeartRate, setWorkoutHeartRate] = useState(0);
  const [workoutCalories, setWorkoutCalories] = useState(0);

  useEffect(() => {
    if (!storageKeys) return;
    setDayData(loadDayData(storageKeys.nutrition, selectedDate));
    setWorkoutHistory(loadWorkoutHistory(storageKeys.workout_history));
    setWeekPlan(loadWeekPlan(storageKeys.week_plan));
  }, [storageKeys, selectedDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (searchModalOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    if (!searchModalOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
      setSelectedProduct(null);
      setGrams(100);
    }
  }, [searchModalOpen]);

  const filteredProducts = useMemo(() => {
    if (!debouncedQuery.trim()) return FOOD_PRODUCTS.slice(0, 20);
    const query = debouncedQuery.toLowerCase();
    return FOOD_PRODUCTS.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 30);
  }, [debouncedQuery]);

  const calculatedNutrients = useMemo(() => {
    if (!selectedProduct) return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const multiplier = grams / 100;
    return {
      calories: Math.round(selectedProduct.calories_per_100g * multiplier),
      protein: Math.round(selectedProduct.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(selectedProduct.carbs_per_100g * multiplier * 10) / 10,
      fats: Math.round(selectedProduct.fat_per_100g * multiplier * 10) / 10,
    };
  }, [selectedProduct, grams]);

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

  const saveData = useCallback((data: DayData) => {
    if (!storageKeys) return;
    saveDayData(storageKeys.nutrition, selectedDate, data);
    setDayData(data);
  }, [storageKeys, selectedDate]);

  const weight = user?.weight || 75;
  const height = user?.height || 175;
  const age = user?.age || 30;
  const isMale = user?.gender !== "female";
  const activityLevel = user?.activityLevel || "moderate";

  const bmr = calculateBMR(weight, height, age, isMale);
  const tdee = Math.round(bmr * getActivityMultiplier(activityLevel));

  const proteinGoal = Math.round(weight * 2);
  const fatsGoal = Math.round(weight * 0.8);
  const carbsGoal = Math.round((tdee - (proteinGoal * 4 + fatsGoal * 9)) / 4);

  const todaySteps = 6500;
  const activityBonus = Math.round(todaySteps * 0.04);
  
  const todayWorkoutCalories = useMemo(() => {
    const today = getTodayDateString();
    return workoutHistory
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
  }, [workoutHistory]);

  const workoutBonus = todayWorkoutCalories + (workoutActive ? workoutCalories : 0);

  const consumed = useMemo(() => {
    return dayData.entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fats: acc.fats + entry.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [dayData.entries]);

  const dailyRemaining = Math.max(0, tdee - consumed.calories + activityBonus + workoutBonus);
  const proteinRemaining = proteinGoal - consumed.protein;
  const carbsRemaining = carbsGoal - consumed.carbs;
  const fatsRemaining = fatsGoal - consumed.fats;

  const totalXP = useMemo(() => calculateXP(workoutHistory), [workoutHistory]);
  const muscleProgress = useMemo(() => calculateMuscleProgress(workoutHistory), [workoutHistory]);
  const workoutDays = useMemo(() => convertHistoryToWorkoutDays(workoutHistory), [workoutHistory]);
  
  const todayMuscles = useMemo(() => {
    const today = getTodayDateString();
    const todayWorkouts = workoutHistory.filter(w => w.date === today);
    return todayWorkouts.flatMap(w => w.bodyParts || []) as ("chest" | "back" | "shoulders" | "arms" | "legs" | "abs")[];
  }, [workoutHistory]);

  const handleWeekPlanChange = useCallback((newPlan: WeekPlan) => {
    setWeekPlan(newPlan);
    if (storageKeys) saveWeekPlan(storageKeys.week_plan, newPlan);
  }, [storageKeys]);

  const addProductEntry = useCallback(() => {
    if (!selectedProduct || grams <= 0) return;
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      product_id: selectedProduct.id,
      name: selectedProduct.name,
      grams,
      calories: calculatedNutrients.calories,
      protein: Math.round(calculatedNutrients.protein),
      carbs: Math.round(calculatedNutrients.carbs),
      fats: Math.round(calculatedNutrients.fats),
      timestamp: Date.now(),
    };
    saveData({ entries: [...dayData.entries, entry] });
    setSearchModalOpen(false);
    setSelectedProduct(null);
    setGrams(100);
    setSearchQuery("");
  }, [selectedProduct, grams, calculatedNutrients, dayData.entries, saveData]);

  const removeEntry = useCallback((id: string) => {
    saveData({ entries: dayData.entries.filter((e) => e.id !== id) });
  }, [dayData.entries, saveData]);

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
    const typeLabel =
      workoutMode === "strength"
        ? `${t("center.strength")}: ${Array.from(selectedBodyParts).map((id) => t(`center.${id}`)).join(", ") || "—"}`
        : t(`center.${cardioType}`) || cardioType;
    const entry: WorkoutHistoryEntry = {
      date: getTodayDateString(),
      type: typeLabel,
      bodyParts: workoutMode === "strength" ? Array.from(selectedBodyParts) : undefined,
      durationSec: workoutElapsedSec,
      caloriesBurned: workoutCalories,
      startedAt: workoutStartTime ?? 0,
    };
    const nextHistory = [entry, ...workoutHistory];
    setWorkoutHistory(nextHistory);
    if (storageKeys) saveWorkoutHistory(storageKeys.workout_history, nextHistory);
    setWorkoutActive(false);
    setWorkoutPaused(false);
    setWorkoutStartTime(null);
    setWorkoutElapsedSec(0);
    setWorkoutCalories(0);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const itemAnim = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="px-5 py-6 pb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Tab switcher */}
      <motion.div variants={itemAnim} className="mb-5 flex gap-1 rounded-xl bg-muted p-1">
        {TAB_KEYS.map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            onClick={() => setActiveTab(tabKey)}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all ${
              activeTab === tabKey ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`center.${tabKey}`)}
          </button>
        ))}
      </motion.div>

      {/* Питание tab - always mounted, hidden via CSS */}
      <div
        className={`transition-opacity duration-200 ${
          activeTab === "nutrition" ? "block opacity-100" : "hidden opacity-0"
        }`}
      >
            {/* Week selector + calendar */}
            <motion.div variants={itemAnim} className="mb-6">
              <div className="flex items-center gap-1">
                <div className="flex flex-1 justify-between gap-1">
                  {weekDays.map((day) => (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${
                        selectedDate === day.dateStr
                          ? "bg-primary text-primary-foreground"
                          : day.isToday
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-[10px] font-medium">{day.dayName}</span>
                      <span className="text-sm font-semibold">{day.date.getDate()}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(true)}
                  className="flex h-[52px] w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Calendar className="h-5 w-5" />
                </button>
              </div>
            </motion.div>

            {/* Main calories block */}
            <motion.div variants={itemAnim} className="mb-6">
              <div className="rounded-3xl bg-card border border-border p-6 text-center">
                <motion.p 
                  className="text-6xl font-bold tabular-nums text-foreground"
                  key={dailyRemaining}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {dailyRemaining}
                </motion.p>
                <p className="mt-1 text-sm text-muted-foreground">Осталось калорий</p>
                
                <div className="mt-4 flex justify-center gap-6">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>+{activityBonus}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span>+{workoutBonus}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Macros - no cards */}
            <motion.div variants={itemAnim} className="mb-6">
              <div className="flex justify-around">
                <MacroCircle
                  icon={Beef}
                  label={t("center.proteinShort")}
                  remaining={proteinRemaining}
                  goal={proteinGoal}
                  color="#EF4444"
                />
                <MacroCircle
                  icon={Wheat}
                  label={t("center.carbsShort")}
                  remaining={carbsRemaining}
                  goal={carbsGoal}
                  color="#F59E0B"
                />
                <MacroCircle
                  icon={Droplet}
                  label={t("center.fatsShort")}
                  remaining={fatsRemaining}
                  goal={fatsGoal}
                  color="#22C55E"
                />
              </div>
            </motion.div>

            {/* Food entries */}
            <motion.div variants={itemAnim} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Съедено
                </h2>
                <span className="text-xs text-muted-foreground">{consumed.calories} ккал</span>
              </div>
              
              {dayData.entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                  <p className="text-sm text-muted-foreground">Нет записей</p>
                  <p className="mt-1 text-xs text-muted-foreground">Нажмите + чтобы добавить</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayData.entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.grams ? `${entry.grams}г · ` : ""}{entry.calories} ккал · Б{entry.protein} Ж{entry.fats} У{entry.carbs}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="ml-3 p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Floating add button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
              style={{
                bottom: "calc(88px + env(safe-area-inset-bottom))",
                right: 20,
              }}
            >
              <Plus className="h-6 w-6" />
            </button>
      </div>

      {/* Спорт tab - Premium minimalist design */}
      <div
        className={`transition-opacity duration-200 ${
          activeTab === "sport" ? "block opacity-100" : "hidden opacity-0"
        }`}
      >
        {workoutHistory.length === 0 && !workoutActive ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
              <Dumbbell className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="mb-2 text-lg font-medium text-foreground">Пора качнуть форму</p>
            <p className="mb-6 text-sm text-muted-foreground">Начнем?</p>
            <Button 
              className="gap-2"
              onClick={() => {
                setWorkoutMode("strength");
                setSelectedBodyParts(new Set(["chest"]));
              }}
            >
              <Play className="h-4 w-4" />
              Запустить тренировку
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Workout Overlay */}
            {workoutActive && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-primary/10 border border-primary/20 p-5"
              >
                <div className="text-center mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-primary mb-1">Активная тренировка</p>
                  <p className="text-4xl font-mono font-bold text-foreground">
                    {formatTime(workoutElapsedSec)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 rounded-xl bg-background/50 p-3">
                    <Heart className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Пульс</p>
                      <p className="text-sm font-semibold">{workoutHeartRate} bpm</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-background/50 p-3">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Калории</p>
                      <p className="text-sm font-semibold">~{workoutCalories}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={pauseWorkout}>
                    {workoutPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {workoutPaused ? t("center.continue") : t("center.pause")}
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2" onClick={stopWorkout}>
                    <Square className="h-4 w-4" />
                    {t("center.stop")}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Hero Block - Avatar & Level */}
            {!workoutActive && (
              <SportHero
                totalWorkouts={workoutHistory.length}
                totalXP={totalXP}
                userName={user?.name}
              />
            )}

            {/* Muscle Map */}
            {!workoutActive && (
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                  Мышечная карта
                </h3>
                <MuscleMap
                  progress={muscleProgress}
                  onMuscleClick={(muscle) => {
                    setWorkoutMode("strength");
                    setSelectedBodyParts(new Set([muscle]));
                  }}
                />
              </div>
            )}

            {/* Quick Start Workout */}
            {!workoutActive && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Быстрый старт
                </h3>
                <div className="space-y-3">
                  {/* Strength workout */}
                  <div className="rounded-2xl bg-muted/30 p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
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
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                              selected 
                                ? "bg-primary text-primary-foreground shadow-sm" 
                                : "bg-muted hover:bg-muted/80 text-foreground"
                            }`}
                          >
                            {t(`center.${id}` as "center.chest")}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      className="w-full gap-2 h-11"
                      onClick={() => { setWorkoutMode("strength"); startWorkout(); }}
                      disabled={selectedBodyParts.size === 0}
                    >
                      <Dumbbell className="h-4 w-4" />
                      Силовая
                    </Button>
                  </div>

                  {/* Cardio chips */}
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {CARDIO_TYPES.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setWorkoutMode("cardio");
                          setCardioType(id);
                          startWorkout();
                        }}
                        className="flex-shrink-0 rounded-xl bg-muted/50 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        {t(`center.${id}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Program */}
            {!workoutActive && (
              <WorkoutProgram
                weekPlan={weekPlan}
                onPlanChange={handleWeekPlanChange}
                todayWorkouts={todayMuscles}
              />
            )}

            {/* Workout Calendar */}
            {!workoutActive && (
              <WorkoutCalendar
                workoutDays={workoutDays}
                weekPlan={weekPlan}
              />
            )}
          </div>
        )}
      </div>

      {/* Calendar popup */}
      <CalendarPopup
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        nutritionKey={storageKeys?.nutrition || null}
      />

      {/* Fullscreen add product modal - rendered via Portal at document.body */}
      <FullscreenModal open={searchModalOpen} onClose={() => !selectedProduct && setSearchModalOpen(false)}>
        {!selectedProduct ? (
          <>
            {/* Search header with safe area */}
            <div 
              className="shrink-0 bg-background px-5 pb-3"
              style={{ paddingTop: "calc(16px + env(safe-area-inset-top))" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Добавить продукт</h2>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("center.searchProduct")}
                  className="h-12 rounded-xl border-border bg-muted/50 pl-10 text-base"
                />
              </div>
            </div>

            {/* Products list - scrollable */}
            <div 
              className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5"
              style={{ paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}
            >
              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted-foreground">{t("factors.noData")}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product);
                        setGrams(100);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {FOOD_CATEGORIES[product.category] || product.category}
                        </p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {product.calories_per_100g}
                        </p>
                        <p className="text-[10px] text-muted-foreground">ккал/100г</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Product detail header */}
            <div 
              className="shrink-0 bg-background px-5"
              style={{ paddingTop: "calc(16px + env(safe-area-inset-top))" }}
            >
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="flex h-10 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
                Назад к поиску
              </button>
            </div>

            {/* Product detail content - scrollable */}
            <div 
              className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5"
              style={{ paddingBottom: 120 }}
            >
              {/* Product info */}
              <div className="mb-6 pt-4 text-center">
                <h3 className="text-xl font-semibold text-foreground">{selectedProduct.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {FOOD_CATEGORIES[selectedProduct.category] || selectedProduct.category}
                </p>
              </div>

              {/* Per 100g info */}
              <div className="mb-6 rounded-2xl border border-border bg-muted/30 p-4">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  На 100 грамм
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{selectedProduct.calories_per_100g}</p>
                    <p className="text-[10px] text-muted-foreground">ккал</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-500">{selectedProduct.protein_per_100g}</p>
                    <p className="text-[10px] text-muted-foreground">белки</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-500">{selectedProduct.carbs_per_100g}</p>
                    <p className="text-[10px] text-muted-foreground">углеводы</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-500">{selectedProduct.fat_per_100g}</p>
                    <p className="text-[10px] text-muted-foreground">жиры</p>
                  </div>
                </div>
              </div>

              {/* Grams input */}
              <div className="mb-8">
                <p className="mb-3 text-center text-sm text-muted-foreground">Укажите количество</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setGrams(Math.max(10, grams - 10))}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted active:scale-95"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <div className="relative">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={2000}
                      value={grams}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setGrams(Math.min(2000, Math.max(0, v)));
                      }}
                      className="h-14 w-28 rounded-2xl border-border bg-card text-center text-2xl font-bold tabular-nums"
                    />
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                      грамм
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGrams(Math.min(2000, grams + 10))}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted active:scale-95"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Calculated nutrients */}
              <motion.div
                key={grams}
                initial={{ scale: 0.98, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="rounded-2xl border border-primary/30 bg-primary/5 p-4"
              >
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-primary">
                  Итого за {grams}г
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-foreground">{calculatedNutrients.calories}</p>
                    <p className="text-[10px] text-muted-foreground">ккал</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-500">{calculatedNutrients.protein}</p>
                    <p className="text-[10px] text-muted-foreground">белки</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-500">{calculatedNutrients.carbs}</p>
                    <p className="text-[10px] text-muted-foreground">углеводы</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-500">{calculatedNutrients.fats}</p>
                    <p className="text-[10px] text-muted-foreground">жиры</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Fixed add button at bottom */}
            <div 
              className="pointer-events-none absolute bottom-0 left-0 right-0"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div 
                className="pointer-events-auto px-5 pb-4 pt-10"
                style={{ background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent 100%)" }}
              >
                <Button
                  className="h-14 w-full rounded-[18px] text-base font-medium"
                  onClick={addProductEntry}
                  disabled={grams <= 0}
                >
                  Добавить
                </Button>
              </div>
            </div>
          </>
        )}
      </FullscreenModal>
    </motion.div>
  );
}
