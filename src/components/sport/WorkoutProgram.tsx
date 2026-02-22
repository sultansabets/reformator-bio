import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type MuscleGroup = "chest" | "back" | "shoulders" | "arms" | "legs" | "abs";
type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface WeekPlan {
  [key: string]: MuscleGroup[];
}

interface WorkoutProgramProps {
  weekPlan: WeekPlan;
  onPlanChange: (plan: WeekPlan) => void;
  todayWorkouts?: MuscleGroup[];
}

const DAYS: { key: DayOfWeek; short: string }[] = [
  { key: "monday", short: "Пн" },
  { key: "tuesday", short: "Вт" },
  { key: "wednesday", short: "Ср" },
  { key: "thursday", short: "Чт" },
  { key: "friday", short: "Пт" },
  { key: "saturday", short: "Сб" },
  { key: "sunday", short: "Вс" },
];

const MUSCLES: MuscleGroup[] = ["chest", "back", "shoulders", "arms", "legs", "abs"];

const DEFAULT_PROGRAM: WeekPlan = {
  monday: ["chest"],
  wednesday: ["back"],
  friday: ["legs"],
};

export function WorkoutProgram({ weekPlan, onPlanChange, todayWorkouts }: WorkoutProgramProps) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [tempPlan, setTempPlan] = useState<WeekPlan>(weekPlan);

  const today = new Date().getDay();
  const todayKey = DAYS[(today + 6) % 7]?.key;

  const handleUseDefault = () => {
    setTempPlan(DEFAULT_PROGRAM);
    onPlanChange(DEFAULT_PROGRAM);
    setEditMode(false);
  };

  const handleToggleMuscle = (day: DayOfWeek, muscle: MuscleGroup) => {
    setTempPlan((prev) => {
      const dayMuscles = prev[day] || [];
      const newMuscles = dayMuscles.includes(muscle)
        ? dayMuscles.filter((m) => m !== muscle)
        : [...dayMuscles, muscle];
      return { ...prev, [day]: newMuscles };
    });
  };

  const handleSave = () => {
    onPlanChange(tempPlan);
    setEditMode(false);
    setEditingDay(null);
  };

  const handleCancel = () => {
    setTempPlan(weekPlan);
    setEditMode(false);
    setEditingDay(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Программа недели
        </h3>
        {!editMode && (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="text-xs text-primary hover:underline"
          >
            Изменить
          </button>
        )}
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {DAYS.map(({ key, short }) => {
          const muscles = (editMode ? tempPlan : weekPlan)[key] || [];
          const isToday = key === todayKey;
          const hasPlan = muscles.length > 0;
          const isCompleted = todayWorkouts && isToday && todayWorkouts.length > 0;

          return (
            <button
              key={key}
              type="button"
              onClick={() => editMode && setEditingDay(editingDay === key ? null : key)}
              disabled={!editMode}
              className={`
                relative flex flex-col items-center py-2 rounded-lg transition-all
                ${isToday ? "bg-primary/10" : ""}
                ${editMode ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"}
                ${editingDay === key ? "ring-1 ring-primary" : ""}
              `}
            >
              <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                {short}
              </span>
              <div className={`
                mt-1 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold
                ${isCompleted 
                  ? "bg-green-500 text-white" 
                  : hasPlan 
                    ? "bg-muted text-foreground" 
                    : "bg-transparent text-muted-foreground/50"
                }
              `}>
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : hasPlan ? (
                  muscles.length
                ) : (
                  "—"
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Edit day panel */}
      <AnimatePresence>
        {editMode && editingDay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-muted/30 mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                {DAYS.find(d => d.key === editingDay)?.short} — выберите группы мышц:
              </p>
              <div className="flex flex-wrap gap-2">
                {MUSCLES.map((muscle) => {
                  const selected = (tempPlan[editingDay] || []).includes(muscle);
                  return (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => handleToggleMuscle(editingDay, muscle)}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                        ${selected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80 text-foreground"
                        }
                      `}
                    >
                      {t(`center.${muscle}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit mode actions */}
      {editMode && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleUseDefault}
          >
            Стандартная
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleCancel}
          >
            Отмена
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={handleSave}
          >
            Сохранить
          </Button>
        </div>
      )}

      {/* Today's plan */}
      {!editMode && weekPlan[todayKey] && weekPlan[todayKey].length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <p className="text-[10px] text-primary uppercase tracking-wider mb-1">Сегодня</p>
          <p className="text-sm font-medium text-foreground">
            {weekPlan[todayKey].map(m => t(`center.${m}`)).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
