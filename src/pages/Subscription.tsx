import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore, type SubscriptionPlan } from "@/store/subscriptionStore";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanCardProps {
  name: string;
  price: string;
  description: string;
  features: PlanFeature[];
  planKey: SubscriptionPlan;
  currentPlan: SubscriptionPlan;
  onSelect: (plan: SubscriptionPlan) => void;
  icon: React.ReactNode;
}

function PlanCard({ name, price, description, features, planKey, currentPlan, onSelect, icon }: PlanCardProps) {
  const isSelected = currentPlan === planKey;

  return (
    <motion.div
      variants={item}
      className={`
        relative overflow-hidden rounded-2xl border bg-card p-6
        transition-all duration-200
        ${isSelected 
          ? "border-primary shadow-lg shadow-primary/10" 
          : "border-border hover:border-muted-foreground/50 hover:shadow-md"
        }
      `}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className={`
          flex h-10 w-10 items-center justify-center rounded-lg
          ${isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}
        `}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          <p className="text-2xl font-bold text-foreground">{price}</p>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{description}</p>

      <ul className="mb-6 space-y-2.5">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${feature.included ? "text-primary" : "text-muted-foreground/40"}`} />
            <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        className="w-full"
        variant={isSelected ? "outline" : "default"}
        onClick={() => !isSelected && onSelect(planKey)}
        disabled={isSelected}
      >
        {isSelected ? "Текущий план" : "Выбрать план"}
      </Button>
    </motion.div>
  );
}

export default function Subscription() {
  const navigate = useNavigate();
  const { plan, setPlan, setExpiry } = useSubscriptionStore();

  const handleSelectPlan = (newPlan: SubscriptionPlan) => {
    setPlan(newPlan);
    if (newPlan !== "free") {
      const oneMonth = Date.now() + 30 * 24 * 60 * 60 * 1000;
      setExpiry(oneMonth);
    } else {
      setExpiry(null);
    }
  };

  const proFeatures: PlanFeature[] = [
    { text: "Доступ к ИИ внутри приложения", included: true },
    { text: "Анализ сна и нагрузки", included: true },
    { text: "Персональные рекомендации", included: true },
    { text: "История запросов к ИИ", included: true },
  ];

  const proPlusFeatures: PlanFeature[] = [
    { text: "Всё из Pro AI", included: true },
    { text: "Расширенная интерпретация анализов", included: true },
    { text: "Глубокая спортивная аналитика", included: true },
    { text: "Приоритетная обработка ИИ", included: true },
    { text: "Персональный протокол рекомендаций", included: true },
    { text: "Будущие премиум-функции", included: true },
  ];

  return (
    <motion.div
      className="min-h-screen bg-background px-5 pt-4 pb-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>
      </motion.div>

      <motion.div variants={item} className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Выберите план</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Получите доступ к ИИ и расширенной аналитике
        </p>
      </motion.div>

      {plan === "free" && (
        <motion.div
          variants={item}
          className="mb-6 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-center"
        >
          <p className="text-sm text-muted-foreground">У вас базовый доступ</p>
        </motion.div>
      )}

      <div className="space-y-4">
        <PlanCard
          name="Pro AI"
          price="9$ / месяц"
          description="Для личного использования."
          features={proFeatures}
          planKey="pro"
          currentPlan={plan}
          onSelect={handleSelectPlan}
          icon={<Sparkles className="h-5 w-5" />}
        />

        <PlanCard
          name="Pro AI+"
          price="29$ / месяц"
          description="Максимальные возможности для глубокой аналитики."
          features={proPlusFeatures}
          planKey="pro_plus"
          currentPlan={plan}
          onSelect={handleSelectPlan}
          icon={<Zap className="h-5 w-5" />}
        />
      </div>

      {plan !== "free" && (
        <motion.div variants={item} className="mt-6 text-center">
          <button
            type="button"
            onClick={() => handleSelectPlan("free")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Вернуться на базовый план
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
