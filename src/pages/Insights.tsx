import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FlaskConical, ChevronRight } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";

const sleepData = [
  { day: "Пн", hours: 7.2, quality: 80 },
  { day: "Вт", hours: 6.8, quality: 65 },
  { day: "Ср", hours: 7.5, quality: 85 },
  { day: "Чт", hours: 8.0, quality: 90 },
  { day: "Пт", hours: 6.5, quality: 60 },
  { day: "Сб", hours: 7.8, quality: 82 },
  { day: "Вс", hours: 7.4, quality: 78 },
];

const loadData = [
  { day: "Пн", load: 8.2 },
  { day: "Вт", load: 14.5 },
  { day: "Ср", load: 10.1 },
  { day: "Чт", load: 16.3 },
  { day: "Пт", load: 6.8 },
  { day: "Сб", load: 12.4 },
  { day: "Вс", load: 9.7 },
];

const recoveryData = [
  { day: "Пн", score: 72 },
  { day: "Вт", score: 65 },
  { day: "Ср", score: 78 },
  { day: "Чт", score: 85 },
  { day: "Пт", score: 60 },
  { day: "Сб", score: 80 },
  { day: "Вс", score: 82 },
];

const periods = ["День", "Неделя", "Месяц"] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Insights = () => {
  const [period, setPeriod] = useState<(typeof periods)[number]>("Неделя");
  const navigate = useNavigate();

  return (
    <motion.div
      className="px-5 pt-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={item} className="mb-6 text-2xl font-bold text-foreground">
        Аналитика
      </motion.h1>

      {/* Переключатель периода */}
      <motion.div variants={item} className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              period === p
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </motion.div>

      {/* Тренды сна */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Тренды сна
        </h2>
        <Card className="mb-5 border-0 shadow-sm">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={sleepData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis hide domain={[5, 9]} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Нагрузка */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Нагрузка
        </h2>
        <Card className="mb-5 border-0 shadow-sm">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={loadData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="load"
                  stroke="hsl(var(--status-amber))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(var(--status-amber))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* История восстановления */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          История восстановления
        </h2>
        <Card className="mb-5 border-0 shadow-sm">
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={recoveryData}>
                <defs>
                  <linearGradient id="recoveryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--status-green))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--status-green))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis hide domain={[50, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--status-green))"
                  strokeWidth={2}
                  fill="url(#recoveryGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Лабораторные данные */}
      <motion.div variants={item} className="mb-8">
        <Card
          className="cursor-pointer border-0 shadow-sm transition-shadow hover:shadow-md"
          onClick={() => navigate("/lab-insights")}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                <FlaskConical className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Лаб. анализы</p>
                <p className="text-xs text-muted-foreground">Анализ биомаркеров</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Insights;
