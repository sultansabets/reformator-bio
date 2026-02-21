import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SleepMode from "@/components/SleepMode";

const STORAGE_KEY = "smartWake_alarm";
const SLEEP_CYCLE_MINUTES = 90;

interface DaySleepData {
  date: string;
  hours: number;
  quality: number;
  bedtime: number;
  recovery: number;
}

const generateSleepData = (): DaySleepData[] => {
  const data: DaySleepData[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    
    const baseHours = 7 + (Math.random() - 0.5) * 2;
    const quality = Math.round(60 + Math.random() * 35);
    const bedtime = 23 + Math.random() * 1.5;
    const recovery = Math.round(45 + Math.random() * 45);
    
    data.push({
      date: dateStr,
      hours: Math.round(baseHours * 10) / 10,
      quality,
      bedtime: bedtime >= 24 ? bedtime - 24 : bedtime,
      recovery,
    });
  }
  return data;
};

const sleepHistory = generateSleepData();

interface SleepMetrics {
  avgSleep: number;
  avgQuality: number;
  avgBedtime: number;
  avgRecovery: number;
  sleepCycles: number;
  energyForecast: number;
}

function getMetrics(days: number = 7): SleepMetrics {
  const recentData = sleepHistory.slice(-days);
  const avgSleep = recentData.reduce((sum, d) => sum + d.hours, 0) / recentData.length;
  const avgQuality = recentData.reduce((sum, d) => sum + d.quality, 0) / recentData.length;
  const avgBedtime = recentData.reduce((sum, d) => sum + d.bedtime, 0) / recentData.length;
  const avgRecovery = recentData.reduce((sum, d) => sum + d.recovery, 0) / recentData.length;
  const sleepCycles = Math.round((avgSleep * 60) / SLEEP_CYCLE_MINUTES);
  const energyForecast = Math.min(100, Math.round((avgSleep / 8) * (avgQuality / 100) * 100 + avgRecovery * 0.1));
  return { avgSleep, avgQuality, avgBedtime, avgRecovery, sleepCycles, energyForecast };
}

function calculateOptimalWakeTime(metrics: SleepMetrics): string {
  const { avgSleep, avgQuality, avgRecovery, avgBedtime } = metrics;

  let targetCycles = Math.round((avgSleep * 60) / SLEEP_CYCLE_MINUTES);
  if (targetCycles < 4) targetCycles = 4;
  if (targetCycles > 6) targetCycles = 6;

  let baseDurationMinutes = targetCycles * SLEEP_CYCLE_MINUTES;

  if (avgSleep < 6.5) baseDurationMinutes += 30;
  if (avgQuality < 60) baseDurationMinutes += 20;
  if (avgRecovery < 60) baseDurationMinutes += 15;
  if (avgRecovery > 80) baseDurationMinutes -= 15;

  const bedtimeMinutes = avgBedtime * 60;
  const wakeMinutes = bedtimeMinutes + baseDurationMinutes;
  const normalizedMinutes = wakeMinutes >= 1440 ? wakeMinutes - 1440 : wakeMinutes;

  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = Math.round((normalizedMinutes % 60) / 5) * 5;
  return `${String(hours).padStart(2, "0")}:${String(minutes >= 60 ? 0 : minutes).padStart(2, "0")}`;
}

function formatSleepDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}ч ${m}м`;
}

function formatBedtime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getSleepQualityColor(quality: number): string {
  if (quality >= 75) return "#22C55E";
  if (quality >= 55) return "#F59E0B";
  return "#EF4444";
}

function MoonIcon({ size = 100 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const center = size / 2;
    const baseRadius = size * 0.32;
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
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="mx-auto"
    />
  );
}

function WheelPicker({
  value,
  options,
  onChange,
  label,
}: {
  value: number;
  options: number[];
  onChange: (v: number) => void;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_HEIGHT = 48;
  const VISIBLE_ITEMS = 5;
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToValue = useCallback((val: number, smooth = true) => {
    const container = containerRef.current;
    if (!container) return;
    const index = options.indexOf(val);
    if (index === -1) return;
    const targetScroll = index * ITEM_HEIGHT;
    container.scrollTo({
      top: targetScroll,
      behavior: smooth ? "smooth" : "auto",
    });
  }, [options]);

  useEffect(() => {
    scrollToValue(value, false);
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      
      const scrollTop = container.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(options.length - 1, index));
      const newValue = options[clampedIndex];
      
      if (newValue !== value) {
        onChange(newValue);
        if (navigator.vibrate) {
          navigator.vibrate(5);
        }
      }
      
      container.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });
    }, 80);
  }, [options, value, onChange]);

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </span>
      )}
      <div 
        className="relative overflow-hidden"
        style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
      >
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        <div 
          className="absolute inset-x-0 z-20 pointer-events-none border-y border-primary/20"
          style={{ 
            top: ITEM_HEIGHT * 2,
            height: ITEM_HEIGHT,
          }}
        />
        
        <div
          ref={containerRef}
          className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          onScroll={handleScroll}
          style={{ 
            scrollSnapType: "y mandatory",
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <div
                key={opt}
                className={`flex items-center justify-center snap-center transition-all duration-150 ${
                  isSelected ? "text-foreground" : "text-muted-foreground/40"
                }`}
                style={{ height: ITEM_HEIGHT }}
              >
                <span className={`text-4xl font-light tabular-nums ${isSelected ? "scale-100" : "scale-90"} transition-transform`}>
                  {String(opt).padStart(2, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SleepChart({ data, period }: { data: DaySleepData[]; period: 7 | 30 }) {
  const chartData = data.slice(-period);
  const maxHours = Math.max(...chartData.map(d => d.hours), 8);
  const minHours = Math.min(...chartData.map(d => d.hours), 5);
  
  const getY = (hours: number) => {
    const range = maxHours - minHours;
    return 100 - ((hours - minHours) / range) * 80;
  };

  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * 100;
    const y = getY(d.hours);
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
            <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
          </linearGradient>
        </defs>
        
        <polygon
          points={areaPoints}
          fill="url(#chartGradient)"
        />
        
        <polyline
          points={points}
          fill="none"
          stroke="#22C55E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        
        {chartData.map((d, i) => {
          const x = (i / (chartData.length - 1)) * 100;
          const y = getY(d.hours);
          return (
            <circle
              key={d.date}
              cx={x}
              cy={y}
              r="2"
              fill="#22C55E"
              className="opacity-60"
            />
          );
        })}
      </svg>
      
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-muted-foreground/60 px-1">
        {period === 7 ? (
          chartData.map((d, i) => (
            <span key={d.date}>
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][i] || ""}
            </span>
          ))
        ) : (
          <>
            <span>30д</span>
            <span>15д</span>
            <span>Сегодня</span>
          </>
        )}
      </div>
    </div>
  );
}

function CalendarModal({
  open,
  onClose,
  sleepData,
  selectedDate,
  onSelectDate,
}: {
  open: boolean;
  onClose: () => void;
  sleepData: DaySleepData[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [viewDate, setViewDate] = useState(new Date());

  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; sleepQuality: number | null }[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      const d = new Date(year, month, -startDayOfWeek + i + 1);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayData = sleepData.find(s => s.date === dateStr);
      days.push({ date: d, dateStr, isCurrentMonth: false, sleepQuality: dayData?.quality || null });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayData = sleepData.find(s => s.date === dateStr);
      days.push({ date: d, dateStr, isCurrentMonth: true, sleepQuality: dayData?.quality || null });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dayData = sleepData.find(s => s.date === dateStr);
      days.push({ date: d, dateStr, isCurrentMonth: false, sleepQuality: dayData?.quality || null });
    }

    return days;
  }, [viewDate, sleepData]);

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="mx-4 w-full max-w-[340px] rounded-2xl border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
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
            const today = new Date();
            const isToday = day.dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => {
                  onSelectDate(day.dateStr);
                  onClose();
                }}
                className={`relative flex flex-col items-center py-2 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "bg-muted"
                    : day.isCurrentMonth
                    ? "hover:bg-muted/50"
                    : "opacity-30"
                }`}
              >
                <span className="text-xs font-medium">{day.date.getDate()}</span>
                {day.sleepQuality !== null && (
                  <span
                    className="mt-0.5 h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: getSleepQualityColor(day.sleepQuality) }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Хороший
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> Средний
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Плохой
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SmartWake() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [wakeHour, setWakeHour] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved.split(":")[0], 10) : 7;
  });
  const [wakeMinute, setWakeMinute] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved.split(":")[1], 10) : 30;
  });

  const [sleepModeActive, setSleepModeActive] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<7 | 30>(7);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  const wakeTime = `${String(wakeHour).padStart(2, "0")}:${String(wakeMinute).padStart(2, "0")}`;

  const metrics = useMemo(() => getMetrics(chartPeriod), [chartPeriod]);
  const recommended = useMemo(() => calculateOptimalWakeTime(metrics), [metrics]);

  const showSleepWarning = metrics.avgSleep < 6 || metrics.avgRecovery < 50;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, wakeTime);
  }, [wakeTime]);

  const handleUseRecommendation = () => {
    const [h, m] = recommended.split(":").map(Number);
    setWakeHour(h);
    setWakeMinute(m);
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const handleActivateSleepMode = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setSleepModeActive(true);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  if (sleepModeActive) {
    return <SleepMode wakeTime={wakeTime} onCancel={() => setSleepModeActive(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header 
        className="flex h-14 shrink-0 items-center justify-between px-5"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
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
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        >
          <Calendar className="h-5 w-5" />
        </button>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-32">
          {/* Moon animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center pt-4"
          >
            <MoonIcon size={100} />
          </motion.div>

          {/* Time label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mt-4 mb-2"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Подъем в
            </p>
          </motion.div>

          {/* Wheel pickers */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-4"
          >
            <WheelPicker
              value={wakeHour}
              options={hours}
              onChange={setWakeHour}
            />
            <span className="text-4xl font-light text-muted-foreground mt-6">:</span>
            <WheelPicker
              value={wakeMinute}
              options={minutes}
              onChange={setWakeMinute}
            />
          </motion.div>

          {/* Recommendation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-8 text-center"
          >
            <p className="text-[11px] text-muted-foreground mb-2">
              Рекомендуемое время: <span className="text-primary font-medium">{recommended}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseRecommendation}
              className="text-xs h-8"
            >
              Использовать рекомендацию
            </Button>
          </motion.div>

          {showSleepWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 mx-auto max-w-[280px] rounded-lg bg-orange-500/10 px-4 py-2 text-center"
            >
              <p className="text-xs text-orange-400">
                Рекомендуется увеличить продолжительность сна
              </p>
            </motion.div>
          )}

          {/* Divider */}
          <div className="my-8 h-px bg-border" />

          {/* Analytics section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
              Аналитика сна
            </p>

            {/* Period toggle */}
            <div className="flex gap-1 rounded-lg bg-muted p-1 mb-5">
              <button
                type="button"
                onClick={() => setChartPeriod(7)}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                  chartPeriod === 7
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                7 дней
              </button>
              <button
                type="button"
                onClick={() => setChartPeriod(30)}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                  chartPeriod === 30
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                30 дней
              </button>
            </div>

            {/* Chart */}
            <div className="mb-6">
              <SleepChart data={sleepHistory} period={chartPeriod} />
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Средний сон ({chartPeriod} дн)</span>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {formatSleepDuration(metrics.avgSleep)}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Среднее засыпание</span>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {formatBedtime(metrics.avgBedtime)}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Качество сна</span>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {Math.round(metrics.avgQuality)}%
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Восстановление</span>
                <span className="ml-auto text-sm font-medium text-foreground">
                  {Math.round(metrics.avgRecovery)}%
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground">Прогноз бодрости</span>
                <span className="ml-auto text-sm font-medium text-primary">
                  {metrics.energyForecast}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="pointer-events-none absolute bottom-0 left-0 right-0"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div 
          className="pointer-events-auto px-5 pb-4 pt-10"
          style={{ background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent 100%)" }}
        >
          <Button
            className="w-full h-14 rounded-[18px] text-base font-medium"
            onClick={handleActivateSleepMode}
          >
            Включить умный подъем
          </Button>
        </div>
      </motion.div>

      {/* Calendar modal */}
      <AnimatePresence>
        {calendarOpen && (
          <CalendarModal
            open={calendarOpen}
            onClose={() => setCalendarOpen(false)}
            sleepData={sleepHistory}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
