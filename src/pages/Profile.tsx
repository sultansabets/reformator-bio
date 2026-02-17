import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  Activity,
  Watch,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { formatDateRu, validateBirthDate } from "@/lib/dateFormat";
import { NUTRITION_GOAL_LABELS, type NutritionGoal } from "@/lib/health";

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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type ModalType = "email" | "dob" | "activity" | "device" | "lab" | "setting" | null;

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
  const [labOpen, setLabOpen] = useState(false);
  const devices = buildDevices(user?.wearable);
  const [modalPayload, setModalPayload] = useState<{
    device?: (typeof devices)[number];
    labItem?: string;
    settingLabel?: string;
  } | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

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

  const openModal = (
    type: ModalType,
    payload?: { device?: { id: string; name: string; connected: boolean; lastSync: string; battery: string }; labItem?: string; settingLabel?: string }
  ) => {
    setModal(type);
    setModalPayload(payload ?? null);
  };

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
      className="min-h-screen bg-background px-5 pt-8 pb-6"
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
          <p className="mt-0.5 text-xs text-muted-foreground">
            {user?.nickname
              ? `@${user.nickname.replace(/[^a-zA-Z0-9_.]/g, "") || "user"}`
              : "@nickname"}
          </p>
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

      {/* Мед карта */}
      <motion.div variants={item}>
        <Collapsible open={labOpen} onOpenChange={setLabOpen}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Мед карта
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
                    Мед карта
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
                {LAB_RESULT_ITEMS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => openModal("lab", { labItem: label })}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-200 hover:bg-muted/40"
                  >
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
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
              {modal === "device" && modalPayload?.device?.name}
              {modal === "lab" && modalPayload?.labItem}
              {modal === "setting" && modalPayload?.settingLabel}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {modal === "device" && modalPayload?.device && (
                <span className="block pt-1">
                  Статус: {modalPayload.device.connected ? "Подключено" : "Не подключено"}
                  <br />
                  Синхронизация: {modalPayload.device.lastSync}
                  <br />
                  Заряд: {modalPayload.device.battery}
                  {modalPayload.device.id === "apple" && !modalPayload.device.connected && (
                    <>
                      <br />
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        onClick={() => {
                          const grant = window.confirm("Разрешить доступ к данным Health? (демо)");
                          if (grant) updateUser({ wearable: "apple" });
                          setModal(null);
                        }}
                      >
                        Подключить
                      </Button>
                    </>
                  )}
                  {modalPayload.device.id === "reformator-band" && !modalPayload.device.connected && (
                    <p className="mt-2 text-xs">Подключение пока недоступно.</p>
                  )}
                </span>
              )}
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
    </motion.div>
  );
};

export default Profile;
