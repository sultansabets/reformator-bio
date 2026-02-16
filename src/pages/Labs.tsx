import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

function getLabStatus(
  value: number,
  min: number,
  max: number
): { label: "Норма" | "Ниже нормы" | "Выше нормы"; type: "success" | "warning" | "destructive" } {
  if (value < min) return { label: "Ниже нормы", type: "destructive" };
  if (value > max) return { label: "Выше нормы", type: "destructive" };
  return { label: "Норма", type: "success" };
}

/** Optional "Низкая граница" when value is in range but in lowest 10% of reference */
function getLabStatusWithLowBorder(
  value: number,
  min: number,
  max: number
): { label: "Норма" | "Ниже нормы" | "Выше нормы" | "Низкая граница"; type: "success" | "warning" | "destructive" } {
  const base = getLabStatus(value, min, max);
  if (base.label !== "Норма") return base;
  const range = max - min;
  if (range > 0 && value <= min + range * 0.1) return { label: "Низкая граница", type: "warning" };
  return base;
}

const statusTypeClass = {
  success: "text-status-green",
  warning: "text-status-amber",
  destructive: "text-destructive",
};

interface MockAnalysis {
  id: string;
  name: string;
  value: number;
  unit: string;
  refMin: number;
  refMax: number;
  /** Use "Низкая граница" when in lowest 10% of range */
  useLowBorder?: boolean;
}

const MOCK_ANALYSES: MockAnalysis[] = [
  {
    id: "vitamin-d",
    name: "Vitamin D",
    value: 22,
    unit: "ng/mL",
    refMin: 30,
    refMax: 100,
  },
  {
    id: "testosterone",
    name: "Тестостерон (общий)",
    value: 14.2,
    unit: "nmol/L",
    refMin: 12,
    refMax: 35,
  },
  {
    id: "hemoglobin",
    name: "Гемоглобин",
    value: 146,
    unit: "g/L",
    refMin: 130,
    refMax: 170,
  },
  {
    id: "ferritin",
    name: "Ферритин",
    value: 38,
    unit: "ng/mL",
    refMin: 30,
    refMax: 400,
    useLowBorder: true,
  },
];

export default function Labs() {
  return (
    <motion.div
      className="px-5 pt-12 pb-24"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={item} className="mb-6 text-2xl font-bold text-foreground">
        Анализы
      </motion.h1>

      <div className="space-y-3">
        {MOCK_ANALYSES.map((analysis) => {
          const status = analysis.useLowBorder
            ? getLabStatusWithLowBorder(analysis.value, analysis.refMin, analysis.refMax)
            : getLabStatus(analysis.value, analysis.refMin, analysis.refMax);
          return (
            <motion.div key={analysis.id} variants={item}>
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="p-4">
                  <p className="mb-1 text-sm font-semibold text-foreground">
                    {analysis.name}
                  </p>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                    <span className="font-medium text-foreground">
                      {analysis.value} {analysis.unit}
                    </span>
                    <span className="text-muted-foreground">
                      Референс: {analysis.refMin}–{analysis.refMax} {analysis.unit}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-xs font-medium",
                      statusTypeClass[status.type]
                    )}
                  >
                    {status.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Только для учёта. Не заменяет консультацию врача.
      </p>
    </motion.div>
  );
}
