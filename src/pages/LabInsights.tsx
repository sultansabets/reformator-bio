import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const biomarkers = [
  {
    name: "Витамин D",
    value: "28 нг/мл",
    status: "low" as const,
    explanation: "Немного ниже нормы. Может влиять на энергию и иммунитет.",
    impacts: ["Энергия", "Иммунитет"],
  },
  {
    name: "Железо (Ферритин)",
    value: "85 нг/мл",
    status: "optimal" as const,
    explanation: "В пределах нормы. Поддерживает транспорт кислорода и восстановление.",
    impacts: ["Восстановление", "Энергия"],
  },
  {
    name: "Кортизол",
    value: "14 мкг/дл",
    status: "optimal" as const,
    explanation: "Утренний кортизол в норме. Стрессовая реакция здоровая.",
    impacts: ["Стресс", "Восстановление"],
  },
  {
    name: "Тестостерон",
    value: "620 нг/дл",
    status: "optimal" as const,
    explanation: "Здоровый уровень, поддерживает восстановление мышц и настроение.",
    impacts: ["Восстановление", "Энергия"],
  },
  {
    name: "HbA1c",
    value: "5.4%",
    status: "optimal" as const,
    explanation: "Хороший контроль сахара в крови за последние 3 месяца.",
    impacts: ["Энергия"],
  },
  {
    name: "СРБ",
    value: "2.8 мг/л",
    status: "moderate" as const,
    explanation: "Лёгкое воспаление. Рекомендуется отдых и противовоспалительное питание.",
    impacts: ["Восстановление", "Стресс"],
  },
];

const statusConfig = {
  optimal: { color: "hsl(var(--status-green))", label: "Норма" },
  moderate: { color: "hsl(var(--status-amber))", label: "Умеренно" },
  low: { color: "hsl(var(--status-red))", label: "Низкий" },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const LabInsights = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="px-5 pt-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Лаб. анализы</h1>
      </motion.div>

      <div className="space-y-3">
        {biomarkers.map((b) => {
          const s = statusConfig[b.status];
          return (
            <motion.div key={b.name} variants={item}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-sm font-semibold text-foreground">{b.name}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{b.value}</span>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                    {b.explanation}
                  </p>
                  <div className="flex gap-1.5">
                    {b.impacts.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] font-medium"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        variants={item}
        className="mt-6 mb-8 text-center text-[10px] text-muted-foreground"
      >
        Только информационные данные. Не является медицинским диагнозом.
      </motion.p>
    </motion.div>
  );
};

export default LabInsights;
