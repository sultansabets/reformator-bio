import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

const CATEGORY_KEYS = ["all", "nutraceuticals", "cosmetics", "clothing", "accessories"] as const;

const products = [
  {
    nameKey: "store.products.magnesium",
    benefitKey: "store.benefits.magnesium",
    price: "8 500",
    categoryKey: "nutraceuticals",
    img: "🧬",
  },
  {
    nameKey: "store.products.vitaminD",
    benefitKey: "store.benefits.vitaminD",
    price: "6 200",
    categoryKey: "nutraceuticals",
    img: "☀️",
  },
  {
    nameKey: "store.products.omega3",
    benefitKey: "store.benefits.omega3",
    price: "12 500",
    categoryKey: "nutraceuticals",
    img: "🐟",
  },
  {
    nameKey: "store.products.ashwagandha",
    benefitKey: "store.benefits.ashwagandha",
    price: "9 800",
    categoryKey: "nutraceuticals",
    img: "🌿",
  },
  {
    nameKey: "store.products.coq10",
    benefitKey: "store.benefits.coq10",
    price: "15 400",
    categoryKey: "nutraceuticals",
    img: "⚡",
  },
  {
    nameKey: "store.products.zinc",
    benefitKey: "store.benefits.zinc",
    price: "4 900",
    categoryKey: "nutraceuticals",
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
  const { t } = useTranslation();
  const [category, setCategory] = useState<string>("all");

  const filtered = category === "all"
    ? products
    : products.filter((p) => p.categoryKey === category);

  return (
    <motion.div
      className="min-h-screen bg-store-bg px-5 pt-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="mb-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("store.title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("store.recommended")}
        </p>
      </motion.div>

      <motion.div variants={item} className="mb-5 mt-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
              category === key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {t(`store.${key}`)}
          </button>
        ))}
      </motion.div>

      {/* Сетка товаров */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p) => (
          <motion.div key={p.nameKey} variants={item}>
            <Card className="overflow-hidden border border-border shadow-sm">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <span className="mb-3 text-2xl">{p.img}</span>
                <h3 className="text-sm font-semibold leading-tight text-foreground">
                  {t(p.nameKey)}
                </h3>
                <p className="mt-1.5 text-xs leading-snug text-muted-foreground line-clamp-2">
                  {t(p.benefitKey)}
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
                  {t("store.addToCart")}
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
