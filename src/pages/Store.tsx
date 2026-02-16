import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

const categories = ["Все", "Восстановление", "Энергия", "Сон", "Иммунитет"] as const;

const products = [
  {
    name: "Магний глицинат",
    benefit: "Поддерживает глубокий сон и восстановление",
    price: "8 500",
    category: "Сон",
    img: "🧬",
  },
  {
    name: "Витамин D3 + K2",
    benefit: "Укрепляет иммунитет и здоровье костей",
    price: "6 200",
    category: "Иммунитет",
    img: "☀️",
  },
  {
    name: "Омега-3",
    benefit: "Снижает воспаление, здоровье мозга",
    price: "12 500",
    category: "Восстановление",
    img: "🐟",
  },
  {
    name: "Ашваганда KSM-66",
    benefit: "Снижает кортизол и стресс",
    price: "9 800",
    category: "Восстановление",
    img: "🌿",
  },
  {
    name: "CoQ10 Убихинол",
    benefit: "Клеточная выработка энергии",
    price: "15 400",
    category: "Энергия",
    img: "⚡",
  },
  {
    name: "Цинк пиколинат",
    benefit: "Иммунная поддержка и тестостерон",
    price: "4 900",
    category: "Иммунитет",
    img: "🛡️",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const Store = () => {
  const [category, setCategory] = useState<string>("Все");

  const filtered = category === "Все"
    ? products
    : products.filter((p) => p.category === category);

  return (
    <motion.div
      className="min-h-screen bg-store-bg px-5 pt-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="mb-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Магазин
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Рекомендовано для вас
        </p>
      </motion.div>

      {/* Фильтры категорий */}
      <motion.div variants={item} className="mb-5 mt-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
              category === c
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </motion.div>

      {/* Сетка товаров */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p) => (
          <motion.div key={p.name} variants={item}>
            <Card className="overflow-hidden border border-border shadow-sm">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <span className="mb-3 text-2xl">{p.img}</span>
                <h3 className="text-sm font-semibold leading-tight text-foreground">
                  {p.name}
                </h3>
                <p className="mt-1.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                  {p.benefit}
                </p>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {p.price} ₸
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 w-full rounded-md text-xs font-medium"
                >
                  <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                  В корзину
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="h-8" />
    </motion.div>
  );
};

export default Store;
