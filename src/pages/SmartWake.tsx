import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SleepMode from "@/components/SleepMode";

const STORAGE_KEY = "smartWake_alarm";
const SLEEP_CYCLE_MINUTES = 90;

const sleepData = [
  { day: "Пн", hours: 7.2, quality: 72, bedtime: 23.5 },
  { day: "Вт", hours: 6.8, quality: 65, bedtime: 0.2 },
  { day: "Ср", hours: 7.5, quality: 78, bedtime: 23.2 },
  { day: "Чт", hours: 8.0, quality: 85, bedtime: 22.8 },
  { day: "Пт", hours: 6.5, quality: 58, bedtime: 1.0 },
  { day: "Сб", hours: 7.8, quality: 80, bedtime: 0.5 },
  { day: "Вс", hours: 7.4, quality: 75, bedtime: 23.5 },
];

interface SleepMetrics {
  avgSleep: number;
  avgQuality: number;
  avgBedtime: number;
  recoveryScore: number;
  sleepCycles: number;
  energyForecast: number;
}

function getMetrics(): SleepMetrics {
  const avgSleep = sleepData.reduce((sum, d) => sum + d.hours, 0) / sleepData.length;
  const avgQuality = sleepData.reduce((sum, d) => sum + d.quality, 0) / sleepData.length;
  const avgBedtime = sleepData.reduce((sum, d) => sum + d.bedtime, 0) / sleepData.length;
  const recoveryScore = 55;
  const sleepCycles = Math.round((avgSleep * 60) / SLEEP_CYCLE_MINUTES);
  const energyForecast = Math.min(100, Math.round((avgSleep / 8) * (avgQuality / 100) * 100));
  return { avgSleep, avgQuality, avgBedtime, recoveryScore, sleepCycles, energyForecast };
}

function calculateOptimalWakeTime(metrics: SleepMetrics): string {
  const { avgSleep, avgQuality, recoveryScore, avgBedtime } = metrics;

  let targetCycles = Math.round((avgSleep * 60) / SLEEP_CYCLE_MINUTES);
  if (targetCycles < 4) targetCycles = 4;
  if (targetCycles > 6) targetCycles = 6;

  let baseDurationMinutes = targetCycles * SLEEP_CYCLE_MINUTES;

  if (avgSleep < 6.5) baseDurationMinutes += 30;
  if (avgQuality < 60) baseDurationMinutes += 20;
  if (recoveryScore < 60) baseDurationMinutes += 15;
  if (recoveryScore > 80) baseDurationMinutes -= 15;

  const bedtimeMinutes = avgBedtime * 60;
  const wakeMinutes = bedtimeMinutes + baseDurationMinutes;
  const normalizedMinutes = wakeMinutes >= 1440 ? wakeMinutes - 1440 : wakeMinutes;

  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = Math.round(normalizedMinutes % 60 / 5) * 5;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatBedtime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function MoonIcon() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 120;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const center = size / 2;
    const baseRadius = 35;
    let startTime: number | null = null;

    const draw = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, size * dpr, size * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      const breathe = Math.sin(elapsed / 3500) * 0.04 + 1;
      const glowIntensity = Math.sin(elapsed / 4500) * 0.15 + 0.85;
      const radius = baseRadius * breathe;

      const floatX = Math.sin(elapsed / 6000) * 1.5;
      const floatY = Math.cos(elapsed / 7000) * 1;
      const moonCenterX = center + floatX;
      const moonCenterY = center + floatY;

      const glowGradient = ctx.createRadialGradient(
        moonCenterX, moonCenterY, radius * 0.5,
        moonCenterX, moonCenterY, radius * 2.5
      );
      glowGradient.addColorStop(0, `rgba(253, 224, 71, ${0.12 * glowIntensity})`);
      glowGradient.addColorStop(0.4, `rgba(253, 224, 71, ${0.04 * glowIntensity})`);
      glowGradient.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(moonCenterX, moonCenterY, radius, 0, Math.PI * 2);
      const moonGradient = ctx.createRadialGradient(
        moonCenterX - radius * 0.25, moonCenterY - radius * 0.25, 0,
        moonCenterX, moonCenterY, radius
      );
      moonGradient.addColorStop(0, "#fefce8");
      moonGradient.addColorStop(0.4, "#fef08a");
      moonGradient.addColorStop(1, "#facc15");
      ctx.fillStyle = moonGradient;
      ctx.shadowBlur = 20 * glowIntensity;
      ctx.shadowColor = "rgba(250, 204, 21, 0.4)";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(
        moonCenterX + radius * 0.35,
        moonCenterY - radius * 0.1,
        radius * 0.7,
        0, Math.PI * 2
      );
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      ctx.restore();
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 120, height: 120 }}
      className="mx-auto"
    />
  );
}

function TimeSelector({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (v: string) => void;
}) {
  const [hours, minutes] = value.split(":").map(Number);

  const adjustHours = (delta: number) => {
    let h = hours + delta;
    if (h < 0) h = 23;
    if (h > 23) h = 0;
    onChange(`${String(h).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  };

  const adjustMinutes = (delta: number) => {
    let m = minutes + delta * 5;
    if (m < 0) m = 55;
    if (m > 55) m = 0;
    onChange(`${String(hours).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => adjustHours(1)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
        <span className="text-7xl font-light tabular-nums text-foreground tracking-tight">
          {String(hours).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => adjustHours(-1)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
      <span className="text-7xl font-light text-muted-foreground mb-2">:</span>
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => adjustMinutes(1)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
        <span className="text-7xl font-light tabular-nums text-foreground tracking-tight">
          {String(minutes).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => adjustMinutes(-1)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default function SmartWake() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [wakeTime, setWakeTime] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "07:30";
  });
  
  const [sleepModeActive, setSleepModeActive] = useState(false);

  const metrics = useMemo(() => getMetrics(), []);
  const recommended = useMemo(() => calculateOptimalWakeTime(metrics), [metrics]);
  const optimalBedtime = useMemo(() => {
    const [h, m] = wakeTime.split(":").map(Number);
    const wakeMinutes = h * 60 + m;
    const sleepDuration = metrics.sleepCycles * SLEEP_CYCLE_MINUTES;
    let bedtimeMinutes = wakeMinutes - sleepDuration;
    if (bedtimeMinutes < 0) bedtimeMinutes += 1440;
    const bh = Math.floor(bedtimeMinutes / 60);
    const bm = Math.round(bedtimeMinutes % 60);
    return `${String(bh).padStart(2, "0")}:${String(bm).padStart(2, "0")}`;
  }, [wakeTime, metrics.sleepCycles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, wakeTime);
  }, [wakeTime]);

  const handleActivateSleepMode = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setSleepModeActive(true);
  };

  const showSleepWarning = metrics.avgSleep < 6;

  if (sleepModeActive) {
    return <SleepMode wakeTime={wakeTime} onCancel={() => setSleepModeActive(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between px-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-medium text-muted-foreground">
          {t("smartWake.title")}
        </h1>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <MoonIcon />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
            Подъем в
          </p>
          <TimeSelector value={wakeTime} onChange={setWakeTime} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
            Рекомендовано
          </p>
          <button
            type="button"
            onClick={() => setWakeTime(recommended)}
            className="text-2xl font-light text-primary tabular-nums hover:opacity-80 transition-opacity"
          >
            {recommended}
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground/70 max-w-[200px] mx-auto">
            на основе анализа сна
          </p>
        </motion.div>

        {showSleepWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="mt-6 rounded-lg bg-orange-500/10 px-4 py-2"
          >
            <p className="text-xs text-orange-400">
              Рекомендуется увеличить продолжительность сна
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom info & button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="absolute bottom-0 left-0 right-0 px-5 pb-10"
      >
        {/* Secondary info */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Средний сон (7 дн)</span>
            <span className="text-foreground tabular-nums">{metrics.avgSleep.toFixed(1)}ч</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Время засыпания</span>
            <span className="text-foreground tabular-nums">{formatBedtime(metrics.avgBedtime)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Прогноз бодрости</span>
            <span className="text-foreground tabular-nums">{metrics.energyForecast}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Лечь до</span>
            <span className="text-primary tabular-nums">{optimalBedtime}</span>
          </div>
        </div>

        <Button 
          className="w-full h-14 text-base font-medium" 
          onClick={handleActivateSleepMode}
        >
          Включить умный подъем
        </Button>
      </motion.div>
    </div>
  );
}
