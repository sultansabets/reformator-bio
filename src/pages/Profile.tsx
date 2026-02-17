import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Activity,
  ChevronRight,
  ChevronDown,
  Ruler,
  Scale,
  Target,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateRu, validateBirthDate } from "@/lib/dateFormat";
import { NUTRITION_GOAL_LABELS, type NutritionGoal } from "@/lib/health";

function calculateAge(dob: string): number {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return fullName.slice(0, 2).toUpperCase() || "—";
}

function validateName(value: string): string | null {
  if (!value || !value.trim()) return "Введите имя";
  return null;
}

function validateEmail(value: string): string | null {
  if (!value || !value.trim()) return "Введите email";
  if (!value.includes("@")) return "Email должен содержать @";
  return null;
}

const KZ_CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Атырау",
  "Костанай",
  "Кызылорда",
  "Актау",
  "Петропавловск",
  "Уральск",
  "Талдыкорган",
  "Туркестан",
] as const;

const LAB_RESULT_ITEMS = [
  "Результаты анализов",
  "УЗИ",
  "ЭКГ",
  "Главный врач",
  "Уролог",
  "Спортивный врач",
  "Реабилитолог",
  "Психотерапевт",
] as const;

const MOCK_HISTORY = [
  {
    service: "IV-терапия Майерс",
    doctor: "Др. Ахметов",
    date: "15 февр. 2026",
    status: "пришел",
  },
  {
    service: "Консультация уролога",
    doctor: "Др. Сабиров",
    date: "22 февр. 2026",
    status: "планируется",
  },
];

const MOCK_SUBSCRIPTIONS = [
  {
    name: "IV-терапия PRO",
    expires: "до 30.06.2026",
    services: [
      { name: "IV Майерс", count: 5 },
      { name: "After Sport", count: 3 },
    ],
  },
];

function MedicalTab() {
  return (
    <Card className="border border-border">
      <CardContent className="divide-y divide-border p-0">
        {LAB_RESULT_ITEMS.map((label) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm font-medium text-foreground">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HistoryTab() {
  return (
    <div className="space-y-3">
      {MOCK_HISTORY.map((item, i) => (
        <Card key={i} className="border border-border">
          <CardContent className="p-4 space-y-1">
            <div className="text-sm font-semibold text-foreground">{item.service}</div>
            <div className="text-xs text-muted-foreground">
              {item.date}
            </div>
            <div className="text-xs text-muted-foreground">
              Лечащий врач: {item.doctor}
            </div>
            <div
              className={`text-xs font-medium ${
                item.status === "пришел"
                  ? "text-green-500"
                  : item.status === "планируется"
                  ? "text-blue-500"
                  : item.status === "не пришел"
                  ? "text-red-500"
                  : "text-yellow-500"
              }`}
            >
              {item.status}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SubscriptionsTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {MOCK_SUBSCRIPTIONS.map((sub, index) => (
        <Card key={index} className="border border-border">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {sub.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {sub.expires}
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>

            {openIndex === index && (
              <div className="border-t border-border px-4 py-3 space-y-2">
                {sub.services.map((service, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm text-foreground"
                  >
                    <span>{service.name}</span>
                    <span>x{service.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type ModalType = "email" | "dob" | "activity" | "lab" | "setting" | null;

function validateHeight(value: string): string | null {
  const n = Number(value);
  if (value.trim() === "" || Number.isNaN(n)) return "Введите рост";
  if (n < 120 || n > 220) return "Рост от 120 до 220 см";
  return null;
}
function validateWeight(value: string): string | null {
  const n = Number(value);
  if (value.trim() === "" || Number.isNaN(n)) return "Введите вес";
  if (n < 40 || n > 200) return "Вес от 40 до 200 кг";
  return null;
}

type EditableField = "firstName" | "lastName" | "email" | "dob" | "height" | "weight" | "goal";

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [modal, setModal] = useState<ModalType>(null);
  const [modalPayload, setModalPayload] = useState<{
    labItem?: string;
    settingLabel?: string;
  } | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<"medical" | "history" | "subscriptions">("medical");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editCity, setEditCity] = useState("");

  const profileDisplay = {
    fullName: user?.fullName?.trim() ?? "",
    firstName: user?.firstName?.trim() ?? "",
    lastName: user?.lastName?.trim() ?? "",
    email: user?.email?.trim() ?? "",
    dob: user?.dob?.trim() ?? "",
    activityLevel: user?.activityLevel?.trim() ?? "Авто из тренировок",
    height: user?.height != null ? String(user.height) : "",
    weight: user?.weight != null ? String(user.weight) : "",
    goal: user?.goal ? NUTRITION_GOAL_LABELS[user.goal] : "",
    city: user?.city?.trim() ?? "",
    mentalHealthScore: user?.mentalHealthScore,
    mentalHealthStatus: user?.mentalHealthStatus,
  };

  useEffect(() => {
    if (editOpen && user) {
      setEditFirstName(user.firstName ?? "");
      setEditLastName(user.lastName ?? "");
      setEditNickname(user.nickname ?? "");
      setEditDob(user.dob ?? "");
      setEditHeight(user.height != null ? String(user.height) : "");
      setEditWeight(user.weight != null ? String(user.weight) : "");
      setEditCity(user.city ?? "");
    }
  }, [editOpen, user]);

  useEffect(() => {
    if (editOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editOpen]);

  const openModal = (
    type: ModalType,
    payload?: { labItem?: string; settingLabel?: string }
  ) => {
    setModal(type);
    setModalPayload(payload ?? null);
  };

  const editAge = editDob
    ? (() => {
        const d = new Date(editDob);
        if (Number.isNaN(d.getTime())) return "";
        const now = new Date();
        let years = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--;
        return years >= 0 ? String(years) : "";
      })()
    : "";

  const startEdit = (field: EditableField) => {
    setEditingField(field);
    const value =
      field === "goal" ? user?.goal ?? "" : profileDisplay[field as keyof typeof profileDisplay];
    setEditDraft(typeof value === "string" ? value : "");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditDraft("");
    setEditError(null);
  };

  const saveEdit = () => {
    const field = editingField;
    if (!field) return;
    let err: string | null = null;
    if (field === "fullName") err = validateName(editDraft);
    else if (field === "email") err = validateEmail(editDraft);
    else if (field === "dob") err = validateBirthDate(editDraft);
    else if (field === "height") err = validateHeight(editDraft);
    else if (field === "weight") err = validateWeight(editDraft);
    else if (field === "activity" || field === "goal") err = null;
    if (err) {
      setEditError(err);
      return;
    }
    const trimmed = editDraft.trim();
    if (field === "firstName") {
      updateUser({ firstName: trimmed });
    } else if (field === "lastName") {
      updateUser({ lastName: trimmed });
    } else if (field === "height") {
      updateUser({ height: Number(trimmed) });
    } else if (field === "weight") {
      updateUser({ weight: Number(trimmed) });
    } else if (field === "goal") {
      if (["gain", "maintain", "lose"].includes(trimmed)) {
        updateUser({ goal: trimmed as NutritionGoal });
      }
    } else if (field === "email" || field === "dob") {
      updateUser({ [field]: trimmed });
    }
    setEditingField(null);
    setEditDraft("");
    setEditError(null);
  };

  const personalInfoRows: { key: EditableField | "activity"; label: string; value: string; icon: typeof User; editable: boolean }[] = [
    { key: "firstName", label: "Имя", value: profileDisplay.firstName || "—", icon: User, editable: true },
    { key: "lastName", label: "Фамилия", value: profileDisplay.lastName || "—", icon: User, editable: true },
    { key: "email", label: "Email", value: profileDisplay.email || "—", icon: Mail, editable: true },
    { key: "dob", label: "Дата рождения", value: formatDateRu(profileDisplay.dob) || "—", icon: Calendar, editable: true },
    { key: "height", label: "Рост", value: profileDisplay.height ? `${profileDisplay.height} см` : "—", icon: Ruler, editable: true },
    { key: "weight", label: "Вес", value: profileDisplay.weight ? `${profileDisplay.weight} кг` : "—", icon: Scale, editable: true },
    { key: "activity", label: "Уровень активности", value: profileDisplay.activityLevel || "—", icon: Activity, editable: false },
    { key: "goal", label: "Цель по питанию", value: profileDisplay.goal || "—", icon: Target, editable: true },
  ];

  return (
    <motion.div
      className="min-h-screen overflow-x-hidden bg-background px-5 pt-8 pb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Profile header */}
      <motion.div variants={item} className="mb-4 flex items-center gap-4">
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const r = new FileReader();
              r.onload = () => {
                const dataUrl = r.result as string;
                if (dataUrl) updateUser({ avatar: dataUrl });
              };
              r.readAsDataURL(file);
              e.target.value = "";
            }}
          />
          <Avatar className="h-20 w-20 border-2 border-border cursor-pointer hover:opacity-90 transition-opacity">
            <AvatarImage src={user?.avatar} alt="" />
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
              {getInitials(profileDisplay.fullName || "Имя Фамилия")}
            </AvatarFallback>
          </Avatar>
        </label>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-lg font-semibold tracking-tight text-foreground">
              {(profileDisplay.firstName || profileDisplay.lastName)
                ? `${profileDisplay.firstName || ""} ${profileDisplay.lastName || ""}`.trim()
                : "Имя Фамилия"}
            </span>
            {user?.isVerified && (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                <span className="text-[10px] font-bold text-white">✓</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {user?.nickname
              ? `@${user.nickname.replace(/[^a-zA-Z0-9_.]/g, "") || "user"}`
              : "@nickname"}
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            {user?.dob && (
              <span>
                {calculateAge(user.dob)} лет
              </span>
            )}
            {user?.city && (
              <span>
                {" • "}
                {user.city}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Metrics under header */}
      <motion.div variants={item} className="mb-5 grid grid-cols-2 gap-3">
        {/* Биометрический возраст */}
        {(() => {
          const parseDob = profileDisplay.dob;
          let realAge = 30;
          if (parseDob) {
            const d = new Date(parseDob);
            if (!Number.isNaN(d.getTime())) {
              const diff = Date.now() - d.getTime();
              const years = diff / (1000 * 60 * 60 * 24 * 365.25);
              realAge = Math.max(18, Math.min(90, Math.floor(years)));
            }
          }
          const sleepScore = 80;
          const activityScore = 70;
          const stressScore = 40;
          let bioAge =
            realAge +
            stressScore / 10 -
            sleepScore / 15 -
            activityScore / 20;
          bioAge = Math.round(Math.max(18, Math.min(90, bioAge)));
          let colorClass = "border-status-green text-status-green";
          if (bioAge > realAge + 3) {
            colorClass = "border-status-red text-status-red";
          } else if (bioAge > realAge) {
            colorClass = "border-status-amber text-status-amber";
          }
          return (
            <Card className={`border ${colorClass} bg-card`}>
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Биометрический возраст
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {bioAge}
                </p>
              </CardContent>
            </Card>
          );
        })()}

        {/* Ментальное здоровье */}
        <Card className="border border-border bg-card">
          <CardContent className="p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ментальное здоровье
            </p>
            {profileDisplay.mentalHealthScore == null ? (
              <div className="mt-2">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => navigate("/ai?mental=1")}
                >
                  Узнать
                </Button>
              </div>
            ) : (
              <div className="mt-1">
                <p className="text-2xl font-semibold text-foreground">
                  {profileDisplay.mentalHealthScore}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profileDisplay.mentalHealthStatus || "Стабильное"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Action buttons (one line, like Threads) */}
      <motion.div variants={item} className="mt-4 flex gap-3">
        <Button className="flex-1" onClick={() => setEditOpen(true)}>
          Редактировать профиль
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setBookingOpen(true)}>
          Записаться
        </Button>
      </motion.div>

      {/* Tabs: Медкарта | Записи | Продукты */}
      <motion.div variants={item} className="mt-6 border-b border-border">
        <div className="flex">
          {[
            { key: "medical" as const, label: "Медкарта" },
            { key: "history" as const, label: "Записи" },
            { key: "subscriptions" as const, label: "Продукты" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setProfileTab(tab.key)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                profileTab === tab.key
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab content */}
      <motion.div variants={item} className="mt-4 space-y-4">
        {profileTab === "medical" && <MedicalTab />}
        {profileTab === "history" && <HistoryTab />}
        {profileTab === "subscriptions" && <SubscriptionsTab />}
      </motion.div>

      {/* Тарифы — отдельная секция внизу */}
      <motion.div variants={item} className="mt-8">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Тарифы
          </h2>
          <Card className="border border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">Premium</div>
                  <div className="text-xs text-muted-foreground">29$ / месяц</div>
                </div>
                <Button size="sm">Подключить</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </motion.div>

      {/* Detail modal */}
      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="max-w-[340px] border border-border bg-card p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {modal === "fullName" && "Имя"}
              {modal === "email" && "Email"}
              {modal === "dob" && "Дата рождения"}
              {modal === "activity" && "Уровень активности"}
              {modal === "lab" && modalPayload?.labItem}
              {modal === "setting" && modalPayload?.settingLabel}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {modal === "lab" && (
                <span className="block pt-1">Скоро будет доступно.</span>
              )}
              {modal === "setting" && (
                <span className="block pt-1">Только для отображения. Без сохранения на сервере.</span>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Booking popup */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="border border-border bg-card">
          <DialogHeader>
            <DialogTitle>Запись в клинику</DialogTitle>
            <DialogDescription>
              В ближайшее время здесь будет возможность записаться в клинику.
              Сейчас это демо-версия.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Full-screen edit profile panel */}
      <AnimatePresence>
        {editOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-background flex flex-col overflow-x-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Редактировать профиль</h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Имя</Label>
                <Input
                  id="edit-firstName"
                  value={editFirstName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditFirstName(v);
                    updateUser({ firstName: v });
                  }}
                  className="h-11 mt-1 border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Фамилия</Label>
                <Input
                  id="edit-lastName"
                  value={editLastName}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditLastName(v);
                    updateUser({ lastName: v });
                  }}
                  className="h-11 mt-1 border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nickname">Никнейм</Label>
                <Input
                  id="edit-nickname"
                  value={editNickname}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const sanitized = raw.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                    setEditNickname(sanitized);
                    updateUser({ nickname: sanitized });
                  }}
                  className="h-11 mt-1 border-border bg-background"
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dob">Дата рождения</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editDob}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditDob(v);
                    updateUser({ dob: v });
                  }}
                  className="h-11 mt-1 border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age">Возраст</Label>
                <Input
                  id="edit-age"
                  value={editAge}
                  readOnly
                  className="h-9 mt-1 border-border bg-background text-muted-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-height">Рост (см)</Label>
                  <Input
                    id="edit-height"
                    type="number"
                    min={120}
                    max={220}
                    value={editHeight}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditHeight(v);
                      const n = Number(v);
                      if (!Number.isNaN(n)) updateUser({ height: n });
                    }}
                    className="h-11 mt-1 border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-weight">Вес (кг)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    min={40}
                    max={200}
                    value={editWeight}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditWeight(v);
                      const n = Number(v);
                      if (!Number.isNaN(n)) updateUser({ weight: n });
                    }}
                    className="h-11 mt-1 border-border bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">Город</Label>
                <Select
                  value={editCity}
                  onValueChange={(v) => {
                    setEditCity(v);
                    updateUser({ city: v });
                  }}
                >
                  <SelectTrigger
                    id="edit-city"
                    className="h-11 mt-1 border-border bg-background"
                  >
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-popover">
                    {KZ_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <Button
                className="w-full"
                onClick={() => setEditOpen(false)}
              >
                Сохранить
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Profile;
