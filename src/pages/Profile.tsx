import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Briefcase,
  Calendar,
  Activity,
  Watch,
  Bell,
  Globe,
  Moon,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  Pencil,
  Check,
  X,
  Ruler,
  Scale,
  Target,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

import { formatDateRu, validateBirthDate } from "@/lib/dateFormat";
import {
  calcBmi,
  getBmiCategory,
  BMI_CATEGORY_LABELS,
  NUTRITION_GOAL_LABELS,
  type NutritionGoal,
} from "@/lib/health";

const goals = [
  { label: "Сон", target: "8ч", current: "7ч 42м" },
  { label: "Активность", target: "600 ккал", current: "420 ккал" },
  { label: "Восстановл.", target: "80+", current: "82" },
];

const DEVICE_IDS = ["apple", "reformator-band"] as const;
const DEVICE_LABELS: Record<(typeof DEVICE_IDS)[number], string> = {
  apple: "Apple Watch",
  "reformator-band": "Reformator Band",
};
function buildDevices(wearable?: string): { id: string; name: string; connected: boolean; lastSync: string; battery: string }[] {
  return DEVICE_IDS.map((id) => ({
    id,
    name: DEVICE_LABELS[id],
    connected: wearable === id,
    lastSync: wearable === id ? "2 мин назад" : "—",
    battery: wearable === id ? "85%" : "—",
  }));
}

const labHistory = [
  { date: "12 фев 2025", type: "Общий анализ крови", status: "Норма" },
  { date: "05 янв 2025", type: "Витамин D, ферритин", status: "Витамин D понижен" },
  { date: "20 дек 2024", type: "Липидный профиль", status: "Норма" },
];

const settingsItems = [
  { icon: Bell, label: "Уведомления" },
  { icon: Globe, label: "Язык и единицы" },
  { icon: HelpCircle, label: "Помощь и поддержка" },
  { icon: LogOut, label: "Выйти" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type ModalType =
  | "fullName"
  | "email"
  | "role"
  | "dob"
  | "activity"
  | "device"
  | "lab"
  | "setting"
  | null;

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

type EditableField = "fullName" | "email" | "dob" | "activity" | "height" | "weight" | "goal";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [modal, setModal] = useState<ModalType>(null);
  const [labOpen, setLabOpen] = useState(false);
  const devices = buildDevices(user?.wearable);
  const [modalPayload, setModalPayload] = useState<{
    device?: (typeof devices)[number];
    lab?: (typeof labHistory)[number];
    settingLabel?: string;
  } | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const profileDisplay = {
    fullName: user?.fullName?.trim() ?? "",
    email: user?.email?.trim() ?? "",
    dob: user?.dob?.trim() ?? "",
    activityLevel: user?.activityLevel?.trim() ?? "",
    height: user?.height != null ? String(user.height) : "",
    weight: user?.weight != null ? String(user.weight) : "",
    goal: user?.goal ? NUTRITION_GOAL_LABELS[user.goal] : "",
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openModal = (
    type: ModalType,
    payload?: { device?: { id: string; name: string; connected: boolean; lastSync: string; battery: string }; lab?: (typeof labHistory)[number]; settingLabel?: string }
  ) => {
    setModal(type);
    setModalPayload(payload ?? null);
  };

  const startEdit = (field: EditableField) => {
    setEditingField(field);
    const value =
      field === "activity"
        ? profileDisplay.activityLevel
        : field === "goal"
          ? user?.goal ?? ""
          : profileDisplay[field as keyof typeof profileDisplay];
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
    if (field === "activity") {
      updateUser({ activityLevel: trimmed });
    } else if (field === "fullName") {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      updateUser({
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" ") ?? "",
      });
    } else if (field === "height") {
      updateUser({ height: Number(trimmed) });
    } else if (field === "weight") {
      updateUser({ weight: Number(trimmed) });
    } else if (field === "goal") {
      if (["gain", "maintain", "lose"].includes(trimmed)) {
        updateUser({ goal: trimmed as NutritionGoal });
      }
    } else {
      updateUser({ [field]: trimmed });
    }
    setEditingField(null);
    setEditDraft("");
    setEditError(null);
  };

  const personalInfoRows: { key: EditableField | "role"; label: string; value: string; icon: typeof User; editable: boolean }[] = [
    { key: "fullName", label: "Полное имя", value: profileDisplay.fullName || "—", icon: User, editable: true },
    { key: "email", label: "Электронная почта", value: profileDisplay.email || "—", icon: Mail, editable: true },
    { key: "role", label: "Роль", value: "Пользователь", icon: Briefcase, editable: false },
    { key: "dob", label: "Дата рождения", value: formatDateRu(profileDisplay.dob) || "—", icon: Calendar, editable: true },
    { key: "height", label: "Рост", value: profileDisplay.height ? `${profileDisplay.height} см` : "—", icon: Ruler, editable: true },
    { key: "weight", label: "Вес", value: profileDisplay.weight ? `${profileDisplay.weight} кг` : "—", icon: Scale, editable: true },
    { key: "activity", label: "Уровень активности", value: profileDisplay.activityLevel || "—", icon: Activity, editable: true },
    { key: "goal", label: "Цель по питанию", value: profileDisplay.goal || "—", icon: Target, editable: true },
  ];

  return (
    <motion.div
      className="min-h-screen bg-background px-5 pt-8 pb-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Profile header */}
      <motion.div variants={item} className="mb-6 flex items-center gap-4">
        <Avatar className="h-16 w-16 border border-border">
          <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
            {getInitials(profileDisplay.fullName || "Пользователь")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {profileDisplay.fullName || "Пользователь"}
          </h1>
          <Badge variant="secondary" className="mt-1.5 text-[10px] font-medium">
            Пользователь
          </Badge>
        </div>
      </motion.div>

      {/* Personal info card */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Личные данные
        </h2>
        <Card className="mb-5 border border-border bg-card shadow-sm">
          <CardContent className="divide-y divide-border p-0">
            {personalInfoRows.map((row) => {
              const isEditing = editingField === row.key;
              if (row.key === "role") {
                return (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => openModal("role")}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-200 hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3">
                      <row.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="text-left">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {row.label}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {row.value}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              }
              if (isEditing) {
                return (
                  <div
                    key={row.key}
                    className="px-4 py-3.5"
                  >
                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </p>
                    {row.key === "dob" ? (
                      <input
                        type="date"
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="mb-2 flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        autoFocus
                      />
                    ) : row.key === "goal" ? (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {(["gain", "maintain", "lose"] as const).map((g) => (
                          <Button
                            key={g}
                            type="button"
                            size="sm"
                            variant={user?.goal === g ? "default" : "outline"}
                            onClick={() => {
                              updateUser({ goal: g });
                              setEditingField(null);
                              setEditDraft("");
                              setEditError(null);
                            }}
                          >
                            {NUTRITION_GOAL_LABELS[g]}
                          </Button>
                        ))}
                      </div>
                    ) : row.key === "height" || row.key === "weight" ? (
                      <Input
                        type="number"
                        min={row.key === "height" ? 120 : 40}
                        max={row.key === "height" ? 220 : 200}
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="mb-2 border border-border bg-background"
                        placeholder={row.key === "height" ? "см" : "кг"}
                        autoFocus
                      />
                    ) : (
                      <Input
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        className="mb-2 border border-border bg-background"
                        placeholder={row.label}
                        autoFocus
                      />
                    )}
                    {editError && (
                      <p className="mb-2 text-xs text-destructive">{editError}</p>
                    )}
                    {row.key !== "goal" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          Сохранить
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1.5">
                          <X className="h-3.5 w-3.5" />
                          Отмена
                        </Button>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div
                  key={row.key}
                  className="flex items-center justify-between px-4 py-3.5 transition-colors duration-200 hover:bg-muted/40"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <row.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {row.label}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {row.value}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(row.key)}
                    className="ml-2 flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Редактировать
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* BMI card */}
      {user?.height != null && user?.weight != null && user.height > 0 && user.weight > 0 && (
        <motion.div variants={item} className="mb-5">
          <Card className="border border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ИМТ
              </h3>
              {(() => {
                const bmi = calcBmi(user.weight, user.height);
                if (bmi == null) return null;
                const category = getBmiCategory(bmi);
                return (
                  <>
                    <p className="text-2xl font-semibold text-foreground">{bmi}</p>
                    <p className="text-sm text-muted-foreground">{BMI_CATEGORY_LABELS[category]}</p>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Daily goals */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ежедневные цели
        </h2>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {goals.map((g) => (
            <Card key={g.label} className="border border-border shadow-sm transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <CardContent className="flex flex-col items-center p-3">
                <span className="text-[10px] text-muted-foreground">{g.label}</span>
                <span className="text-lg font-semibold text-foreground">{g.current}</span>
                <span className="text-[10px] text-muted-foreground">/ {g.target}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Connected devices */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Подключённые устройства
        </h2>
        <Card className="mb-5 border border-border shadow-sm">
          <CardContent className="divide-y divide-border p-0">
            {devices.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => openModal("device", { device: d })}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-200 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <Watch className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground">{d.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {d.connected ? "Подключено" : "Не подключено"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: d.connected
                        ? "hsl(var(--status-green))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Lab history */}
      <motion.div variants={item}>
        <Collapsible open={labOpen} onOpenChange={setLabOpen}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Анализы и результаты
          </h2>
          <Card className="mb-5 border border-border shadow-sm overflow-hidden">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-200 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Анализы и результаты
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: labOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y divide-border border-t border-border">
                {labHistory.map((lab, i) => (
                  <button
                    key={`${lab.date}-${i}`}
                    type="button"
                    onClick={() => openModal("lab", { lab })}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-200 hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{lab.type}</p>
                      <p className="text-xs text-muted-foreground">{lab.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{lab.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* Settings */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Настройки
        </h2>
        <Card className="mb-8 border border-border shadow-sm">
          <CardContent className="divide-y divide-border p-0">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Тема</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                aria-label="Переключить тему"
              />
            </div>
            {settingsItems.map((s) => (
              <button
                key={s.label}
                onClick={
                  s.label === "Выйти"
                    ? handleLogout
                    : () => openModal("setting", { settingLabel: s.label })
                }
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors duration-200 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail modal */}
      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="max-w-[340px] border border-border bg-card p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {modal === "fullName" && "Полное имя"}
              {modal === "email" && "Электронная почта"}
              {modal === "role" && "Роль"}
              {modal === "dob" && "Дата рождения"}
              {modal === "activity" && "Уровень активности"}
              {modal === "device" && modalPayload?.device?.name}
              {modal === "lab" && modalPayload?.lab?.type}
              {modal === "setting" && modalPayload?.settingLabel}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {modal === "fullName" && profileDisplay.fullName}
              {modal === "email" && profileDisplay.email}
              {modal === "role" && "Пользователь"}
              {modal === "dob" && (formatDateRu(profileDisplay.dob) || profileDisplay.dob || "—")}
              {modal === "activity" && profileDisplay.activityLevel}
              {modal === "device" && modalPayload?.device && (
                <span className="block pt-1">
                  Статус: {modalPayload.device.connected ? "Подключено" : "Не подключено"}
                  <br />
                  Синхронизация: {modalPayload.device.lastSync}
                  <br />
                  Заряд: {modalPayload.device.battery}
                </span>
              )}
              {modal === "lab" && modalPayload?.lab && (
                <span className="block pt-1">
                  Дата: {modalPayload.lab.date}
                  <br />
                  Статус: {modalPayload.lab.status}
                </span>
              )}
              {modal === "setting" && (
                <span className="block pt-1">Только для отображения. Без сохранения на сервере.</span>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Profile;
