import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ImagePlus,
  Plus,
  Heart,
  MessageCircle,
  Check,
  CheckCheck,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MessageRole = "user" | "support";
type MessageStatus = "sent" | "read";

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  status?: MessageStatus;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  theme: string;
  isPrivate: boolean;
}

interface FeedPost {
  id: string;
  author: string;
  avatar?: string;
  level: number;
  text: string;
  image?: string;
  achievement?: string;
  likes: number;
  comments: number;
  timestamp: number;
}

const GROUP_THEMES = [
  "Восстановление",
  "Сон",
  "Силовые",
  "Биооптимизация",
  "Тестостерон",
  "Ментальная устойчивость",
] as const;

const MOCK_GROUPS: Group[] = [
  { id: "1", name: "Утренние ранние", description: "Подъём в 5–6 утра", members: 234, theme: "Сон", isPrivate: false },
  { id: "2", name: "Тестостерон 30+", description: "Оптимизация для мужчин 30+", members: 189, theme: "Тестостерон", isPrivate: false },
  { id: "3", name: "HRV и восстановление", description: "Трекинг вариабельности", members: 156, theme: "Восстановление", isPrivate: true },
  { id: "4", name: "Силовые 3x в неделю", description: "Базовая программа", members: 412, theme: "Силовые", isPrivate: false },
];

const MOCK_FEED: FeedPost[] = [
  { id: "1", author: "Алексей К.", level: 12, text: "7 дней подряд — сон 90%+. Наконец-то!", achievement: "Состояние +8%", likes: 24, comments: 5, timestamp: Date.now() - 3600000 },
  { id: "2", author: "Мария С.", level: 8, text: "Первая неделя с приложением. Уже чувствую разницу.", achievement: "7 дней без пропуска", likes: 18, comments: 3, timestamp: Date.now() - 7200000 },
  { id: "3", author: "Дмитрий В.", level: 15, text: "Нагрузка в норме 14 дней подряд. Готовлюсь к марафону.", achievement: "Нагрузка в норме 14 дней", likes: 42, comments: 8, timestamp: Date.now() - 14400000 },
];

function SupportTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "support",
      text: "Здравствуйте! Мы ответим в течение 24 часов.",
      timestamp: Date.now() - 60000,
    },
  ]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: `${Date.now()}`,
      role: "user",
      text: input.trim(),
      timestamp: Date.now(),
      status: "sent",
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-280px)] min-h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 border border-border ${
                m.role === "user"
                  ? "bg-card rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}
            >
              <p className="text-sm text-foreground">{m.text}</p>
              <div className="flex items-center gap-1.5 mt-1 justify-end">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(m.timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {m.role === "user" && m.status === "sent" && (
                  <Check className="h-3 w-3 text-muted-foreground" strokeWidth={2.5} />
                )}
                {m.role === "user" && m.status === "read" && (
                  <CheckCheck className="h-3 w-3 text-state-good" strokeWidth={2.5} />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="shrink-0 p-4 pt-2 border-t border-border">
        <p className="text-[11px] text-muted-foreground mb-2">Мы ответим в течение 24 часов</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-card transition-colors"
            aria-label="Прикрепить скрин"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-ring"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0 h-10 w-10 p-0 rounded-lg bg-card hover:bg-accent text-foreground border border-border"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function GroupsTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPrivate, setCreatePrivate] = useState(false);
  const [createTheme, setCreateTheme] = useState(GROUP_THEMES[0]);
  const [joined, setJoined] = useState<Set<string>>(new Set());

  const handleCreate = () => {
    if (!createName.trim()) return;
    setShowCreate(false);
    setCreateName("");
    setCreateDesc("");
  };

  const handleJoin = (id: string) => {
    setJoined((prev) => new Set(prev).add(id));
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <Button
        onClick={() => setShowCreate(true)}
        className="w-full h-12 rounded-lg bg-muted border border-border text-foreground hover:bg-card justify-center gap-2"
      >
        <Plus className="h-5 w-5" />
        Создать группу
      </Button>

      {MOCK_GROUPS.map((g) => (
        <motion.div
          key={g.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 border border-border bg-card transition-colors hover:bg-accent"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">{g.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{g.description}</p>
              <p className="text-[11px] text-muted-foreground mt-2">
                {g.members} участников · {g.theme}
              </p>
            </div>
            <Button
              onClick={() => handleJoin(g.id)}
              disabled={joined.has(g.id)}
              size="sm"
              className="shrink-0 rounded-lg bg-card hover:bg-accent text-foreground border border-border disabled:opacity-50"
            >
              {joined.has(g.id) ? "Вы в группе" : "Вступить"}
            </Button>
          </div>
        </motion.div>
      ))}

      <AnimatePresence>
        {showCreate && (
          <motion.div
            key="create-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-t-2xl p-5 pb-8 bg-card border-t border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-foreground mb-4">Создать группу</h3>
              <div className="space-y-3">
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Название"
                  className="bg-muted border-border text-foreground rounded-lg"
                />
                <Input
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Описание"
                  className="bg-muted border-border text-foreground rounded-lg"
                />
                <div className="flex flex-wrap gap-2">
                  {GROUP_THEMES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCreateTheme(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        createTheme === t ? "bg-card text-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={createPrivate}
                    onChange={(e) => setCreatePrivate(e.target.checked)}
                    className="rounded"
                  />
                  Приватная группа
                </label>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border-border text-muted-foreground"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreate}
                  className="flex-1 rounded-lg bg-card hover:bg-accent text-foreground"
                >
                  Создать
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FeedTab() {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-4">
      {MOCK_FEED.map((p) => (
        <motion.article
          key={p.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 border border-border bg-card transition-colors hover:bg-accent"
        >
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0 border border-border">
              <AvatarImage src={p.avatar} alt="" />
              <AvatarFallback className="bg-card text-xs text-muted-foreground">
                {p.author.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{p.author}</span>
                <span className="text-[10px] text-muted-foreground bg-card px-1.5 py-0.5 rounded">LVL {p.level}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{p.text}</p>
              {p.achievement && (
                <p className="text-xs text-state-good mt-2 font-medium">{p.achievement}</p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <button
                  type="button"
                  onClick={() => toggleLike(p.id)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Heart
                    className={`h-4 w-4 ${liked.has(p.id) ? "fill-state-good text-state-good" : ""}`}
                  />
                  <span className="text-xs">{p.likes + (liked.has(p.id) ? 1 : 0)}</span>
                </button>
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <MessageCircle className="h-4 w-4" />
                  {p.comments}
                </span>
              </div>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

export default function Community() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground mt-1">Единомышленники. Поддержка. Рост.</p>
      </div>

      <Tabs defaultValue="support" className="px-4">
        <TabsList
          className="w-full bg-muted border border-border rounded-lg p-1 mb-4"
        >
          <TabsTrigger
            value="support"
            className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg text-muted-foreground"
          >
            Поддержка
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg text-muted-foreground"
          >
            Группы
          </TabsTrigger>
          <TabsTrigger
            value="feed"
            className="flex-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-lg text-muted-foreground"
          >
            Лента
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support" className="mt-0">
          <SupportTab />
        </TabsContent>
        <TabsContent value="groups" className="mt-0">
          <GroupsTab />
        </TabsContent>
        <TabsContent value="feed" className="mt-0">
          <FeedTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
