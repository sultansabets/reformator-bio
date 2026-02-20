import { useState, useRef, useEffect } from "react";
import { useScrollSource } from "@/contexts/ScrollSourceContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Send, Sparkles, User, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
const PROMPT_KEYS = ["recovery", "testosterone", "cortisol", "energy", "labs", "overtrain"] as const;


type Message = { role: "user" | "assistant"; text: string };

export default function AI() {
  const { t } = useTranslation();
  const scrollSource = useScrollSource();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollSource?.registerScrollRef(scrollRef.current ?? null);
    return () => scrollSource?.registerScrollRef(null);
  }, [scrollSource]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    const matchedKey = PROMPT_KEYS.find((k) =>
      trimmed.toLowerCase().includes((t(`ai.prompts.${k}`) as string).toLowerCase())
    );
    const reply = matchedKey
      ? (t(`ai.responses.${matchedKey}`) as string) || (t("ai.demoAccepted") as string)
      : t("ai.demoAccepted") as string;
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const showQuickPrompts = messages.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-24"
      >
        {showQuickPrompts ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-12 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground">
              {t("ai.welcome")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("ai.choosePrompt")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {PROMPT_KEYS.map((key) => {
                const chip = t(`ai.prompts.${key}`) as string;
                return (
                <button
                  key={key}
                  type="button"
                  onClick={() => send(chip)}
                  className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {chip}
                </button>
              );})}
            </div>
          </motion.div>
        ) : (
          <>
            <div className="mb-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setMessages([])}
              >
                {t("ai.newChat")}
              </Button>
            </div>
            <ul className="space-y-4">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {m.role === "assistant" ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <Card
                    className={`max-w-[85%] border border-border ${
                      m.role === "user" ? "bg-muted" : "bg-card"
                    }`}
                  >
                    <CardContent className="p-3 text-sm text-foreground">
                      {m.text}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 left-0 right-0 z-10 flex-shrink-0 border-t border-border bg-background px-4 py-3 pb-24"
      >
        <div className="flex gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("ai.ariaAttach")}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("ai.placeholder")}
            className="flex-1 border-border bg-background"
          />
          <Button type="submit" size="icon" className="shrink-0" aria-label={t("ai.ariaSend")}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
