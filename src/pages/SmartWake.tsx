import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, AlarmClock, Moon, Activity, Zap, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SleepMode from "@/components/SleepMode";

type WakeMode = "recovery" | "standard" | "performance";

const STORAGE_KEY = "smartWake_mode";
const ALARM_STORAGE_KEY = "smartWake_alarm";

const sleepData = [
  { day: "Пн", hours: 7.2, quality: 72 },
  { day: "Вт", hours: 6.8, quality: 65 },
  { day: "Ср", hours: 7.5, quality: 78 },
  { day: "Чт", hours: 8.0, quality: 85 },
  { day: "Пт", hours: 6.5, quality: 58 },
  { day: "Сб", hours: 7.8, quality: 80 },
  { day: "Вс", hours: 7.4, quality: 75 },
];

const SLEEP_CYCLE_MINUTES = 90;
const AVG_BEDTIME_HOUR = 23.5;

interface SleepMetrics {
  avgSleep: number;
  avgQuality: number;
  recoveryScore: number;
  sleepCycles: number;
}

function getMetrics(): SleepMetrics {
  const avgSleep = sleepData.reduce((sum, d) => sum + d.hours, 0) / sleepData.length;
  const avgQuality = sleepData.reduce((sum, d) => sum + d.quality, 0) / sleepData.length;
  const recoveryScore = 55;
  const sleepCycles = Math.round((avgSleep * 60) / SLEEP_CYCLE_MINUTES);
  return { avgSleep, avgQuality, recoveryScore, sleepCycles };
}

function calculateOptimalWakeTime(
  mode: WakeMode,
  currentAlarm: string,
  metrics: SleepMetrics
): string {
  const { avgSleep, avgQuality, recoveryScore } = metrics;

  let targetCycles: number;
  switch (mode) {
    case "recovery":
      targetCycles = 6;
      break;
    case "performance":
      targetCycles = 5;
      break;
    default:
      targetCycles = 5;
  }

  let baseDurationMinutes = targetCycles * SLEEP_CYCLE_MINUTES;

  if (avgSleep < 6.5) baseDurationMinutes += 30;
  if (avgQuality < 60) baseDurationMinutes += 20;
  if (recoveryScore < 60) baseDurationMinutes += 15;

  const bedtimeMinutes = AVG_BEDTIME_HOUR * 60;
  const wakeMinutes = bedtimeMinutes + baseDurationMinutes;
  const normalizedMinutes = wakeMinutes >= 1440 ? wakeMinutes - 1440 : wakeMinutes;

  const [alarmH, alarmM] = currentAlarm.split(":").map(Number);
  const alarmMinutes = alarmH * 60 + alarmM;

  const diff = Math.abs(normalizedMinutes - alarmMinutes);
  if (diff <= 30) {
    return currentAlarm;
  }

  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = Math.round(normalizedMinutes % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function SmartWake() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<WakeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as WakeMode) || "standard";
  });
  
  const [wakeTime, setWakeTime] = useState(() => {
    return localStorage.getItem(ALARM_STORAGE_KEY) || "08:00";
  });
  
  const [sleepModeActive, setSleepModeActive] = useState(false);

  const metrics = useMemo(() => getMetrics(), []);
  const recommended = useMemo(
    () => calculateOptimalWakeTime(mode, wakeTime, metrics),
    [mode, wakeTime, metrics]
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(ALARM_STORAGE_KEY, wakeTime);
  }, [wakeTime]);

  const handleActivateSleepMode = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setSleepModeActive(true);
  };

  const modeConfig = {
    recovery: { icon: Battery, label: t("smartWake.modeRecovery"), cycles: 6 },
    standard: { icon: Moon, label: t("smartWake.modeStandard"), cycles: 5 },
    performance: { icon: Zap, label: t("smartWake.modePerformance"), cycles: 5 },
  };

  if (sleepModeActive) {
    return <SleepMode wakeTime={wakeTime} onCancel={() => setSleepModeActive(false)} />;
  }

  return (
    <motion.div
      className="min-h-screen bg-background"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{t("smartWake.title")}</h1>
        <div className="w-10" />
      </header>

      <div className="mx-auto max-w-lg px-5 py-6">
        <div className="space-y-6">
          <motion.div variants={item} className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <AlarmClock className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {t("smartWake.subtitle")}
            </p>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border border-border bg-card p-5">
              <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("smartWake.recommended")}
              </p>
              <p className="text-4xl font-bold text-primary tabular-nums">{recommended}</p>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border border-border bg-card p-5">
              <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("smartWake.currentAlarm")}
              </p>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-2xl font-semibold text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("smartWake.selectMode")}
            </p>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-1.5">
              {(["recovery", "standard", "performance"] as WakeMode[]).map((m) => {
                const config = modeConfig[m];
                const Icon = config.icon;
                const isActive = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-center transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium leading-tight">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border border-border bg-card p-5">
              <p className="mb-4 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("smartWake.analysisTitle")}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("smartWake.avgSleep")}</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {metrics.avgSleep.toFixed(1)}ч
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("smartWake.sleepQuality")}</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {Math.round(metrics.avgQuality)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("smartWake.recoveryLabel")}</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {metrics.recoveryScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("smartWake.sleepCycles")}</span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {modeConfig[mode].cycles} {t("smartWake.cyclesUnit")}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Button className="w-full h-12 text-base" onClick={handleActivateSleepMode}>
              {t("smartWake.activateSleepMode")}
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
