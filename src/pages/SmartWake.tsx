import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, AlarmClock, Moon, TrendingUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SleepMode from "@/components/SleepMode";

const sleepData = [
  { day: "Пн", hours: 7.2 },
  { day: "Вт", hours: 6.8 },
  { day: "Ср", hours: 7.5 },
  { day: "Чт", hours: 8.0 },
  { day: "Пт", hours: 6.5 },
  { day: "Сб", hours: 7.8 },
  { day: "Вс", hours: 7.4 },
];

function calculateOptimalWakeTime(): { recommended: string; current: string; analysis: string[] } {
  const avgSleep = sleepData.reduce((sum, d) => sum + d.hours, 0) / sleepData.length;
  const avgBedtime = 23.5;
  const stressLevel = 35;
  const recoveryScore = 72;

  let baseDuration = 8;
  if (avgSleep < 6.5) baseDuration += 0.5;
  if (stressLevel > 50) baseDuration += 0.33;
  if (recoveryScore > 75) baseDuration = 8;

  const wakeHour = avgBedtime + baseDuration;
  const normalizedHour = wakeHour >= 24 ? wakeHour - 24 : wakeHour;
  const hours = Math.floor(normalizedHour);
  const minutes = Math.round((normalizedHour - hours) * 60);

  const recommended = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  const analysis: string[] = [];
  if (avgSleep < 7) {
    analysis.push("Средний сон за неделю ниже нормы — добавлено время");
  }
  if (stressLevel > 50) {
    analysis.push("Повышенный уровень стресса — рекомендуется больше отдыха");
  }
  if (recoveryScore > 75) {
    analysis.push("Хорошее восстановление — стандартный режим");
  }

  return { recommended, current: "08:00", analysis };
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function SmartWake() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sleepModeActive, setSleepModeActive] = useState(false);
  const [wakeTime, setWakeTime] = useState("08:00");

  const { recommended, analysis } = useMemo(() => calculateOptimalWakeTime(), []);

  const avgSleep = useMemo(() => {
    const avg = sleepData.reduce((sum, d) => sum + d.hours, 0) / sleepData.length;
    return avg.toFixed(1);
  }, []);

  const handleActivateSleepMode = () => {
    setSleepModeActive(true);
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
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4">
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

      <div className="px-5 py-6 space-y-6">
        <motion.div variants={item} className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <AlarmClock className="h-10 w-10 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{t("smartWake.subtitle")}</p>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border border-border bg-card p-5">
            <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("smartWake.recommended")}
            </p>
            <p className="text-4xl font-bold text-primary tabular-nums">{recommended}</p>
            <div className="mt-4 space-y-2">
              {analysis.map((text, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
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
          <Card className="border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                <Moon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{t("smartWake.avgSleep")}</p>
                <p className="text-xs text-muted-foreground">{t("smartWake.last7days")}</p>
              </div>
              <span className="text-lg font-bold text-foreground tabular-nums">{avgSleep}ч</span>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{t("smartWake.hrv")}</p>
                <p className="text-xs text-muted-foreground">{t("smartWake.hrvDesc")}</p>
              </div>
              <span className="text-lg font-bold text-foreground tabular-nums">45 ms</span>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="pt-4">
          <Button className="w-full h-12 text-base" onClick={handleActivateSleepMode}>
            {t("smartWake.activateSleepMode")}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
