import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Clock,
  Flame,
  Camera,
  Mic,
  PenLine,
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
  Dumbbell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStorageKey } from "@/lib/userStorage";
import { useTranslation } from "react-i18next";

const TABS = ["Питание", "Спорт"] as const;
type Tab = (typeof TABS)[number];

const BODY_PARTS = ["chest", "back", "legs", "shoulders", "arms", "abs"] as const;
const CARDIO_TYPES = ["run", "swim", "bike", "hiit", "other"] as const;
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

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekDays(): { date: Date; dayName: string; dateStr: string; isToday: boolean }[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const result = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    result.push({
      date,
      dayName: days[i],
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
  name: string;
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
    };
  }, [user?.id]);

  const [activeTab, setActiveTab] = useState<Tab>("Питание");
  const weekDays = useMemo(() => getWeekDays(), []);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [dayData, setDayData] = useState<DayData>({ entries: [] });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<"photo" | "voice" | "manual" | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newCalories, setNewCalories] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [newCarbs, setNewCarbs] = useState("");
  const [newFats, setNewFats] = useState("");

  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([]);
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
  }, [storageKeys, selectedDate]);

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

  const addEntry = useCallback(() => {
    if (!newName.trim()) return;
    const entry: FoodEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName.trim(),
      calories: Math.max(0, Number(newCalories) || 0),
      protein: Math.max(0, Number(newProtein) || 0),
      carbs: Math.max(0, Number(newCarbs) || 0),
      fats: Math.max(0, Number(newFats) || 0),
      timestamp: Date.now(),
    };
    saveData({ entries: [...dayData.entries, entry] });
    setNewName("");
    setNewCalories("");
    setNewProtein("");
    setNewCarbs("");
    setNewFats("");
    setAddModalOpen(false);
    setAddMethod(null);
  }, [newName, newCalories, newProtein, newCarbs, newFats, dayData.entries, saveData]);

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
        ? `Силовая: ${Array.from(selectedBodyParts).map((id) => t(`center.${id}`)).join(", ") || "—"}`
        : WORKOUT_CARDIO_MAP[cardioType] ?? cardioType;
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
      className="min-h-screen px-5 py-6 pb-28"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Tab switcher */}
      <motion.div variants={itemAnim} className="mb-5 flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === "Питание" ? (
          <motion.div
            key="nutrition"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
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
                  label="Белок"
                  remaining={proteinRemaining}
                  goal={proteinGoal}
                  color="#EF4444"
                />
                <MacroCircle
                  icon={Wheat}
                  label="Углеводы"
                  remaining={carbsRemaining}
                  goal={carbsGoal}
                  color="#F59E0B"
                />
                <MacroCircle
                  icon={Droplet}
                  label="Жиры"
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
                          {entry.calories} ккал · Б{entry.protein} Ж{entry.fats} У{entry.carbs}
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
            <div className="fixed bottom-24 right-5 z-40">
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sport"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Strength */}
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Силовые
              </h2>
              <div className="rounded-2xl border border-border bg-card p-5">
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
                      Начать
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center text-3xl font-mono font-semibold text-foreground">
                      {formatTime(workoutElapsedSec)}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                        <Heart className="h-4 w-4 text-destructive" />
                        <div>
                          <p className="text-[10px] text-muted-foreground">Пульс</p>
                          <p className="text-sm font-semibold">{workoutHeartRate} bpm</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
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
                        {workoutPaused ? "Продолжить" : "Пауза"}
                      </Button>
                      <Button variant="destructive" className="flex-1 gap-2" onClick={stopWorkout}>
                        <Square className="h-4 w-4" />
                        Стоп
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cardio */}
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
                      className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted/50"
                    >
                      {WORKOUT_CARDIO_MAP[id]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            {workoutHistory.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  История
                </h2>
                <div className="space-y-2">
                  {workoutHistory.slice(0, 7).map((h, i) => (
                    <div
                      key={`${h.date}-${h.startedAt}-${i}`}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                    >
                      <span className="text-sm text-foreground">{h.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(h.durationSec / 60)} мин · ~{h.caloriesBurned} ккал
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar popup */}
      <CalendarPopup
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        nutritionKey={storageKeys?.nutrition || null}
      />

      {/* Add food modal */}
      <Dialog open={addModalOpen} onOpenChange={(o) => { if (!o) { setAddModalOpen(false); setAddMethod(null); } }}>
        <DialogContent className="max-w-[340px] border border-border bg-card p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base">Добавить еду</DialogTitle>
          </DialogHeader>
          
          {!addMethod ? (
            <div className="p-5 space-y-3">
              <button
                type="button"
                onClick={() => setAddMethod("photo")}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <Camera className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Через фото</p>
                  <p className="text-xs text-muted-foreground">AI распознает еду</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAddMethod("voice")}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <Mic className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Голосом</p>
                  <p className="text-xs text-muted-foreground">Скажите что съели</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAddMethod("manual")}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <PenLine className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Вручную</p>
                  <p className="text-xs text-muted-foreground">Введите данные</p>
                </div>
              </button>
            </div>
          ) : addMethod === "manual" ? (
            <div className="p-5 space-y-4">
              <button
                type="button"
                onClick={() => setAddMethod(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Назад
              </button>
              
              <div>
                <Label className="text-xs">Название</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Куриная грудка"
                  className="mt-1 border-border bg-background"
                />
              </div>
              
              <div>
                <Label className="text-xs">Калории</Label>
                <Input
                  type="number"
                  min={0}
                  value={newCalories}
                  onChange={(e) => setNewCalories(e.target.value)}
                  placeholder="250"
                  className="mt-1 border-border bg-background"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Белки</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newProtein}
                    onChange={(e) => setNewProtein(e.target.value)}
                    placeholder="30"
                    className="mt-1 border-border bg-background"
                  />
                </div>
                <div>
                  <Label className="text-xs">Углеводы</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newCarbs}
                    onChange={(e) => setNewCarbs(e.target.value)}
                    placeholder="0"
                    className="mt-1 border-border bg-background"
                  />
                </div>
                <div>
                  <Label className="text-xs">Жиры</Label>
                  <Input
                    type="number"
                    min={0}
                    value={newFats}
                    onChange={(e) => setNewFats(e.target.value)}
                    placeholder="5"
                    className="mt-1 border-border bg-background"
                  />
                </div>
              </div>
              
              <Button className="w-full" onClick={addEntry} disabled={!newName.trim()}>
                Добавить
              </Button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <button
                type="button"
                onClick={() => setAddMethod(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Назад
              </button>
              
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  {addMethod === "photo" ? (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Mic className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {addMethod === "photo" ? "AI скоро будет доступен" : "Голосовой ввод скоро"}
                </p>
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => setAddMethod("manual")}>
                Ввести вручную
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
