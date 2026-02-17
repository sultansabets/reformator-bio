import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const CHIPS = [
  "Рассчитай ккал",
  "Как улучшить сон?",
  "План тренировок",
  "Анализ состояния",
];

const MOCK_RESPONSES: Record<string, string> = {
  "Рассчитай ккал":
    "Для расчёта суточной нормы калорий нужны рост, вес, возраст и уровень активности. В среднем для поддержания веса: около 2000 ккал для женщин и 2500 для мужчин. Точнее можно в разделе Центр → Питание.",
  "Как улучшить сон?":
    "Рекомендации: ложитесь в одно время, избегайте кофеина за 6 часов до сна, затемните комнату и снизьте температуру. В приложении отслеживайте метрики сна в блоке Факторы влияния.",
  "План тренировок":
    "Можно начать с 3 силовых в неделю и 2 кардио. В разделе Центр → Тренировки выберите тип, засекайте время и сохраняйте — данные появятся на главной.",
  "Анализ состояния":
    "По вашим данным: сон в норме, нагрузка умеренная. Обратите внимание на калории и восстановление. Детали смотрите в блоке Факторы влияния на главной.",
};

const DEFAULT_MOCK = "Принял. Это демо-режим: полный ответ будет доступен после подключения сервиса.";

type Message = { role: "user" | "assistant"; text: string };

export default function AI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [greetingShown, setGreetingShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && !greetingShown) {
      setGreetingShown(true);
    }
  }, [messages.length, greetingShown]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    const key = CHIPS.find((c) => trimmed.toLowerCase().includes(c.toLowerCase()));
    const reply = key ? MOCK_RESPONSES[key] ?? DEFAULT_MOCK : DEFAULT_MOCK;
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-28"
      >
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-16 text-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">Чем могу помочь?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Выберите подсказку или напишите вопрос
            </p>
          </motion.div>
        ) : (
          <ul className="space-y-4">
            {messages.map((m, i) => (
              <li
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {m.role === "assistant" ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <Card
                  className={`max-w-[85%] border border-border ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  <CardContent className="p-3 text-sm">{m.text}</CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => send(chip)}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-3 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишите сообщение..."
            className="flex-1 border-border bg-background"
          />
          <Button type="submit" size="icon" className="shrink-0" aria-label="Отправить">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
