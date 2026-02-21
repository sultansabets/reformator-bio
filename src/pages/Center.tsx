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
  X,
  Beef,
  Wheat,
  Droplet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getRecommendedKcal } from "@/lib/health";
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
  } catch {
    // ignore
  }
}

function MacroCard({ 
  icon: Icon, 
  label, 
  remaining, 
  goal, 
  color,
  bgColor,
}: { 
  icon: React.ElementType;
  label: string;
  remaining: number;
  goal: number;
  color: string;
  bgColor: string;
}) {
  const consumed = goal - remaining;
  const progress = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  const isOver = remaining < 0;
  const displayRemaining = isOver ? remaining : Math.max(0, remaining);
  
  const CIRCLE_SIZE = 56;
  const STROKE_WIDTH = 4;
  const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card border border-border p-4">
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
            opacity={0.3}
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
        <div 
          className="absolute inset-0 flex items-center justify-center rounded-full"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p 
        className="text-lg font-bold tabular-nums"
        style={{ color: isOver ? "#EF4444" : "hsl(var(--foreground))" }}
      >
        {displayRemaining}г
      </p>
      <p className="text-[10px] text-muted-foreground">осталось</p>
    </div>
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

  const weekDays = useMemo(() => getWeekDays(), []);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [dayData, setDayData] = useState<DayData>({ entries: [] });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<"photo" | "voice" | "manual" | null>(null);
  
  const [newName, setNewName] = useState("");
  const [newCalories, setNewCalories] = useState("");
  const [newProtein, setNewProtein] = useState("");
  const [newCarbs, setNewCarbs] = useState("");
  const [newFats, setNewFats] = useState("");

  useEffect(() => {
    if (!storageKeys) return;
    setDayData(loadDayData(storageKeys.nutrition, selectedDate));
  }, [storageKeys, selectedDate]);

  const saveData = useCallback((data: DayData) => {
    if (!storageKeys) return;
    saveDayData(storageKeys.nutrition, selectedDate, data);
    setDayData(data);
  }, [storageKeys, selectedDate]);

  const todaySteps = 6500;
  const activityBonus = Math.round(todaySteps * 0.04);
  
  const todayWorkoutCalories = useMemo(() => {
    if (!storageKeys) return 0;
    try {
      const raw = localStorage.getItem(storageKeys.workout_history);
      if (!raw) return 0;
      const history = JSON.parse(raw);
      if (!Array.isArray(history)) return 0;
      const today = getTodayDateString();
      return history
        .filter((e: { date: string }) => e.date === today)
        .reduce((sum: number, e: { caloriesBurned: number }) => sum + (e.caloriesBurned || 0), 0);
    } catch {
      return 0;
    }
  }, [storageKeys]);

  const workoutBonus = todayWorkoutCalories;

  const weight = user?.weight || 75;
  const goal = user?.goal || "maintain";
  const recommended = user?.height && user?.weight
    ? getRecommendedKcal(user.height, user.weight)
    : { target: 2200 };
  
  let dailyGoal = recommended.target;
  if (goal === "deficit") dailyGoal = Math.round(dailyGoal * 0.85);
  else if (goal === "mass") dailyGoal = Math.round(dailyGoal * 1.15);

  const proteinGoal = Math.round(weight * 1.8);
  const fatsGoal = Math.round(weight * 0.8);
  const carbsGoal = Math.round((dailyGoal - (proteinGoal * 4 + fatsGoal * 9)) / 4);

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

  const dailyRemaining = Math.max(0, dailyGoal - consumed.calories + activityBonus + workoutBonus);
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

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const itemAnim = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

  return (
    <motion.div
      className="min-h-screen px-5 py-6 pb-28"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Week selector */}
      <motion.div variants={itemAnim} className="mb-6">
        <div className="flex justify-between gap-1">
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

      {/* Macros */}
      <motion.div variants={itemAnim} className="mb-6">
        <div className="grid grid-cols-3 gap-3">
          <MacroCard
            icon={Beef}
            label="Белок"
            remaining={proteinRemaining}
            goal={proteinGoal}
            color="#EF4444"
            bgColor="rgba(239, 68, 68, 0.1)"
          />
          <MacroCard
            icon={Wheat}
            label="Углеводы"
            remaining={carbsRemaining}
            goal={carbsGoal}
            color="#F59E0B"
            bgColor="rgba(245, 158, 11, 0.1)"
          />
          <MacroCard
            icon={Droplet}
            label="Жиры"
            remaining={fatsRemaining}
            goal={fatsGoal}
            color="#22C55E"
            bgColor="rgba(34, 197, 94, 0.1)"
          />
        </div>
      </motion.div>

      {/* Food entries */}
      <motion.div variants={itemAnim} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Сегодня съедено
          </h2>
          <span className="text-xs text-muted-foreground">{consumed.calories} ккал</span>
        </div>
        
        {dayData.entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">Нет записей</p>
            <p className="mt-1 text-xs text-muted-foreground">Нажмите + чтобы добавить еду</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayData.entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
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
                  aria-label="Удалить"
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
          aria-label="Добавить еду"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

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
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                  <Camera className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Через фото</p>
                  <p className="text-xs text-muted-foreground">AI распознает еду</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAddMethod("voice")}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <Mic className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Голосом</p>
                  <p className="text-xs text-muted-foreground">Скажите что съели</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAddMethod("manual")}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                  <PenLine className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Вручную</p>
                  <p className="text-xs text-muted-foreground">Введите данные</p>
                </div>
              </button>
            </div>
          ) : addMethod === "manual" ? (
            <div className="p-5 space-y-4">
              <button
                type="button"
                onClick={() => setAddMethod(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
                  <Label className="text-xs">Белки (г)</Label>
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
                  <Label className="text-xs">Жиры (г)</Label>
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
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
                  {addMethod === "photo" 
                    ? "AI-распознавание скоро будет доступно" 
                    : "Голосовой ввод скоро будет доступен"}
                </p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setAddMethod("manual")}
              >
                Ввести вручную
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
