import { useState, useRef, useEffect, useCallback } from "react";
import { useScrollSource } from "@/contexts/ScrollSourceContext";
import { useKeyboard } from "@/contexts/KeyboardContext";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Send, User, Paperclip, RotateCcw } from "lucide-react";
import { ParticlesIcon } from "@/components/ParticlesIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INPUT_BAR_HEIGHT = 56;
const MENU_BAR_HEIGHT = 80;

const PROMPT_KEYS = ["recovery", "testosterone", "cortisol", "energy", "labs", "overtrain"] as const;

const EXAMPLE_KEYS = ["labs", "stress", "testosterone"] as const;

type Message = { role: "user" | "assistant"; text: string };

export default function AI() {
  const { t } = useTranslation();
  const scrollSource = useScrollSource();
  const setKeyboardOpen = useKeyboard()?.setKeyboardOpen;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollSource?.registerScrollRef(scrollRef.current ?? null);
    return () => scrollSource?.registerScrollRef(null);
  }, [scrollSource]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const height = window.innerHeight - vv.height;
      setKeyboardHeight(height > 50 ? height : 0);
    };
    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    inputRef.current?.blur();
    setKeyboardOpen?.(false);

    const matchedKey = PROMPT_KEYS.find((k) =>
      trimmed.toLowerCase().includes((t(`ai.prompts.${k}`) as string).toLowerCase())
    );
    const reply = matchedKey
      ? (t(`ai.responses.${matchedKey}`) as string) || (t("ai.demoAccepted") as string)
      : t("ai.demoAccepted") as string;
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 600);
  }, [t, setKeyboardOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleFocus = () => setKeyboardOpen?.(true);
  const handleBlur = () => {
    setKeyboardOpen?.(false);
    setKeyboardHeight(0);
  };

  const hasMessages = messages.length > 0;
  const inputPaddingBottom = INPUT_BAR_HEIGHT + MENU_BAR_HEIGHT + keyboardHeight;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#000000]" style={{ backgroundColor: "#000000" }}>
      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: `calc(${inputPaddingBottom}px + env(safe-area-inset-bottom, 0px) + 16px)` }}
      >
        <div className="px-5 py-4">
          {/* AI Hero - compact */}
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center pt-4 pb-5"
            >
              <div className="relative">
                <ParticlesIcon size={72} colorRgb="34, 197, 94" className="pointer-events-none" />
              </div>
              <h1 className="mt-3 text-lg font-semibold text-foreground">
                Doctor AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Персональный ассистент
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground/70 text-center max-w-[240px]">
                Основан на ваших данных, сне, нагрузке и анализах
              </p>
            </motion.div>
          )}

          {/* Horizontal chips */}
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-5 -mx-5 px-5"
            >
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {PROMPT_KEYS.map((key) => {
                  const chip = t(`ai.prompts.${key}`) as string;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => send(chip)}
                      className="shrink-0 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-all hover:bg-muted hover:border-muted-foreground/30 active:scale-[0.97]"
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Example queries - compact */}
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="rounded-xl border border-border bg-card/50 p-4"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
                {t("ai.tryAsking")}
              </p>
              <div className="space-y-2">
                {EXAMPLE_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => send(t(`ai.examples.${key}`))}
                    className="flex w-full items-center gap-2 text-left text-sm text-foreground/80 hover:text-foreground transition-colors"
                  >
                    <span className="text-muted-foreground">•</span>
                    <span>{t(`ai.examples.${key}`)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Chat messages */}
          {hasMessages && (
            <div className="space-y-4">
              {/* New chat button */}
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t("ai.newChat")}
                </button>
              </div>

              {/* Messages */}
              <ul className="space-y-3">
                {messages.map((m, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {m.role === "assistant" ? (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <ParticlesIcon size={20} colorRgb="34, 197, 94" className="pointer-events-none" />
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.text}
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Fixed input bar (above BottomNav) */}
      <div
        className="fixed left-0 right-0 z-40 border-t border-border bg-background px-4 py-3"
        style={{
          bottom: MENU_BAR_HEIGHT,
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          transform: `translateY(-${keyboardHeight}px)`,
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t("ai.ariaAttach")}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={t("ai.placeholder")}
            className="flex-1 h-10 rounded-xl border-border bg-card text-sm"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-10 w-10 shrink-0 rounded-xl" 
            aria-label={t("ai.ariaSend")}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
