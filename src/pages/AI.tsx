import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, User, Paperclip } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AI_QUICK_PROMPTS } from "@/constants/aiPrompts";

const MOCK_RESPONSES: Record<string, string> = {
  "Как улучшить восстановление?":
    "Восстановление улучшают сон 7–9 ч, питание с достаточным белком, гидратация и дни отдыха. В приложении смотрите блок Факторы влияния и метрики нагрузки.",
  "Что влияет на тестостерон?":
    "На уровень тестостерона влияют сон, силовые тренировки, жиры в рационе, витамин D и стресс. Рекомендую раздел Центр → Аналитика для отслеживания трендов.",
  "Как снизить кортизол?":
    "Снижению кортизола помогают регулярный сон, умеренные нагрузки, дыхательные практики и снижение кофеина. Отслеживайте стресс в блоке ментального здоровья.",
  "Как повысить энергию?":
    "Энергию поддерживают стабильный сон, вода, белок и движение. Проверьте калории и сон в разделе Центр → Питание и Обзор.",
  "Разбор анализов крови":
    "Для разбора анализов загрузите результаты в раздел Мед карта (Профиль). В демо-режиме полный разбор будет после подключения сервиса.",
  "Что делать при переутомлении?":
    "При переутомлении: снизьте нагрузку, увеличьте сон, пейте достаточно воды. В приложении смотрите блок восстановления и не пропускайте отдых.",
};

const DEFAULT_MOCK = "Принял. Это демо-режим: полный ответ будет доступен после подключения сервиса.";

type Message = { role: "user" | "assistant"; text: string };

export default function AI() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [greetingShown, setGreetingShown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

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

    const key = AI_QUICK_PROMPTS.find((c) => trimmed.toLowerCase().includes(c.toLowerCase()));
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
    <div
      className={`flex h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b ${
        isDark ? "from-indigo-950 to-slate-900" : "from-indigo-50 to-white"
      }`}
    >
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
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/20">
              <Sparkles className="h-7 w-7 text-indigo-500" />
            </div>
            <p className="text-lg font-medium text-foreground">
              Здравствуйте. Я Dr.AI. Чем могу помочь?
            </p>
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/20">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <Card
                  className={`max-w-[85%] border ${
                    m.role === "user"
                      ? "border-border bg-muted text-foreground"
                      : "border-indigo-500/30 bg-indigo-600/10"
                  }`}
                >
                  <CardContent
                    className={`p-3 text-sm ${
                      m.role === "assistant"
                        ? isDark
                          ? "text-indigo-400"
                          : "text-indigo-600"
                        : "text-foreground"
                    }`}
                  >
                    {m.text}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {AI_QUICK_PROMPTS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => send(chip)}
              className="rounded-full border border-indigo-500/30 bg-indigo-600/10 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-indigo-600/20"
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
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Прикрепить файл"
          >
            <Paperclip className="h-4 w-4" />
          </button>
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
