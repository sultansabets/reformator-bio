import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface WorkoutDay {
  date: string;
  workouts: {
    type: string;
    bodyParts?: string[];
    durationSec: number;
    caloriesBurned: number;
  }[];
}

interface WorkoutCalendarProps {
  workoutDays: WorkoutDay[];
  weekPlan: Record<string, string[]>;
  onDateSelect?: (date: string) => void;
}

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const DAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push(d);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  const endDayOfWeek = (lastDay.getDay() + 6) % 7;
  for (let i = 1; i < 7 - endDayOfWeek; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

function getDayKey(date: Date): string {
  const dayIndex = (date.getDay() + 6) % 7;
  const keys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  return keys[dayIndex];
}

type DayStatus = "completed" | "partial" | "missed" | "planned" | "none";

function getDayStatus(
  date: Date,
  workoutDays: WorkoutDay[],
  weekPlan: Record<string, string[]>
): DayStatus {
  const dateStr = getDateString(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dayKey = getDayKey(date);
  const plannedMuscles = weekPlan[dayKey] || [];
  const dayWorkouts = workoutDays.find(d => d.date === dateStr);
  
  if (date > today) return plannedMuscles.length > 0 ? "planned" : "none";
  
  if (dayWorkouts && dayWorkouts.workouts.length > 0) {
    if (plannedMuscles.length === 0) return "completed";
    const completedMuscles = dayWorkouts.workouts.flatMap(w => w.bodyParts || []);
    const allCompleted = plannedMuscles.every(m => completedMuscles.includes(m));
    return allCompleted ? "completed" : "partial";
  }
  
  if (plannedMuscles.length > 0) return "missed";
  return "none";
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins} мин`;
}

export function WorkoutCalendar({ workoutDays, weekPlan, onDateSelect }: WorkoutCalendarProps) {
  const { t } = useTranslation();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(() => getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

  const selectedDayWorkouts = useMemo(() => {
    if (!selectedDate) return null;
    return workoutDays.find(d => d.date === selectedDate);
  }, [selectedDate, workoutDays]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = getDateString(date);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
    onDateSelect?.(dateStr);
  };

  const statusColors: Record<DayStatus, string> = {
    completed: "bg-green-500",
    partial: "bg-orange-500",
    missed: "bg-red-500/60",
    planned: "bg-primary/30",
    none: "",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Календарь
        </h3>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[10px] text-muted-foreground py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          const dateStr = getDateString(date);
          const isCurrentMonth = date.getMonth() === viewDate.getMonth();
          const isToday = dateStr === getDateString(today);
          const isSelected = dateStr === selectedDate;
          const status = getDayStatus(date, workoutDays, weekPlan);

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDateClick(date)}
              className={`
                relative aspect-square flex items-center justify-center rounded-lg text-xs transition-all
                ${isCurrentMonth ? "text-foreground" : "text-muted-foreground/40"}
                ${isToday ? "ring-1 ring-primary" : ""}
                ${isSelected ? "bg-primary/20" : "hover:bg-muted/50"}
              `}
            >
              {date.getDate()}
              {status !== "none" && (
                <span 
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${statusColors[status]}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Выполнено
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Частично
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500/60" /> Пропуск
        </span>
      </div>

      {/* Selected day details */}
      <AnimatePresence>
        {selectedDate && selectedDayWorkouts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-3 rounded-xl bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-foreground">
                  {new Date(selectedDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded-full hover:bg-muted"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-2">
                {selectedDayWorkouts.workouts.map((w, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-foreground">{w.type}</span>
                    <span className="text-muted-foreground">
                      {formatDuration(w.durationSec)} • {w.caloriesBurned} ккал
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
