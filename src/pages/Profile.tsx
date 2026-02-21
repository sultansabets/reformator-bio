import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Pill,
  Plus,
  X,
} from "lucide-react";
import FullscreenModal from "@/components/FullscreenModal";
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
import { type NutritionGoal } from "@/lib/health";

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

function useValidation() {
  const { t } = useTranslation();
  return {
    validateName: (value: string) => (!value?.trim() ? t("errors.enterName") : null),
    validateEmail: (value: string) => {
      if (!value?.trim()) return t("errors.enterEmail");
      if (!value.includes("@")) return t("errors.emailInvalid");
      return null;
    },
    validateHeight: (value: string) => {
      const n = Number(value);
      if (value.trim() === "" || Number.isNaN(n)) return t("errors.enterHeight");
      if (n < 120 || n > 220) return t("errors.heightRange");
      return null;
    },
    validateWeight: (value: string) => {
      const n = Number(value);
      if (value.trim() === "" || Number.isNaN(n)) return t("errors.enterWeight");
      if (n < 40 || n > 200) return t("errors.weightRange");
      return null;
    },
  };
}

const CITY_KEYS = ["almaty","astana","shymkent","karaganda","aktobe","taraz","pavlodar","ustKamenogorsk","semey","atyrau","kostanay","kyzylorda","aktau","petropavlovsk","oral","taldykorgan","turkistan"] as const;

const LAB_ITEM_KEYS = ["labResults","uzi","ekg","mainDoctor","urologist","sportDoctor","rehab","psychotherapist"] as const;

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
  const { t } = useTranslation();
  return (
    <Card className="border border-border">
      <CardContent className="divide-y divide-border p-0">
        {LAB_ITEM_KEYS.map((key) => (
          <div
            key={key}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm font-medium text-foreground">{t(`profile.${key}`)}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function HistoryTab() {
  const { t } = useTranslation();
  const statusKey = (s: string) => s === "пришел" ? "statusCame" : s === "планируется" ? "statusPlanned" : "statusNoShow";
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
              {t("profile.treatingDoctor")}: {item.doctor}
            </div>
            <div
              className={`text-xs font-medium ${
                item.status === "пришел"
                  ? "text-status-green"
                  : item.status === "планируется"
                  ? "text-primary"
                  : item.status === "не пришел"
                  ? "text-status-red"
                  : "text-status-amber"
              }`}
            >
              {t(`profile.${statusKey(item.status)}`)}
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

// --- Medications tab: types and storage ---
type Medication = {
  id: string;
  name: string;
  time: string;
  quantity: number;
  frequency: "daily" | "weekly" | "once";
  startDate: string;
};

type MedicationsData = {
  medications: Medication[];
  taken: Record<string, Record<string, boolean>>;
};

const MEDICATIONS_STORAGE_PREFIX = "medications_";

function getMedicationsStorageKey(userId: string): string {
  return `${MEDICATIONS_STORAGE_PREFIX}${userId}`;
}

function loadMedicationsData(userId: string): MedicationsData {
  if (!userId) return { medications: [], taken: {} };
  try {
    const raw = localStorage.getItem(getMedicationsStorageKey(userId));
    if (!raw) return { medications: [], taken: {} };
    const parsed = JSON.parse(raw) as MedicationsData;
    const meds = Array.isArray(parsed.medications) ? parsed.medications : [];
    const migrated = meds.map((m: Record<string, unknown>) => ({
      id: m.id,
      name: m.name,
      time: typeof m.time === "string" ? m.time : "08:00",
      quantity: typeof m.quantity === "number" ? m.quantity : 1,
      frequency: m.frequency === "daily" || m.frequency === "weekly" || m.frequency === "once" ? m.frequency : "daily",
      startDate: m.startDate,
    })) as Medication[];
    return {
      medications: migrated,
      taken: parsed.taken && typeof parsed.taken === "object" ? parsed.taken : {},
    };
  } catch {
    return { medications: [], taken: {} };
  }
}

function saveMedicationsData(userId: string, data: MedicationsData): void {
  if (!userId) return;
  try {
    localStorage.setItem(getMedicationsStorageKey(userId), JSON.stringify(data));
  } catch {
    // ignore
  }
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isIntakeOnDate(med: Medication, dateStr: string, windowStart: string, windowEnd: string): boolean {
  if (dateStr < med.startDate) return false;
  if (dateStr < windowStart || dateStr > windowEnd) return false;
  if (med.frequency === "once") return dateStr === med.startDate;
  if (med.frequency === "daily") return true;
  if (med.frequency === "weekly") {
    const dStart = new Date(med.startDate + "T12:00:00").getDay();
    const dCur = new Date(dateStr + "T12:00:00").getDay();
    return dStart === dCur;
  }
  return false;
}

function getIntakesForDay(
  medications: Medication[],
  dateStr: string,
  windowStart: string,
  windowEnd: string
): { med: Medication; intakeKey: string }[] {
  const out: { med: Medication; intakeKey: string }[] = [];
  for (const med of medications) {
    if (!isIntakeOnDate(med, dateStr, windowStart, windowEnd)) continue;
    const intakeKey = `${med.id}_${med.time}`;
    out.push({ med, intakeKey });
  }
  return out.sort((a, b) => a.med.time.localeCompare(b.med.time));
}

const FREQUENCY_VALUES = ["daily", "weekly", "once"] as const;

function MedicationsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<MedicationsData>(() => loadMedicationsData(userId));
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateStr(new Date()));
  const [addModalOpen, setAddModalOpen] = useState(false);
  const dayLabels = t("profile.dayLabels", { returnObjects: true }) as string[];

  useEffect(() => {
    setData(loadMedicationsData(userId));
  }, [userId]);

  useEffect(() => {
    saveMedicationsData(userId, data);
  }, [userId, data]);

  useEffect(() => {
    if (addModalOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [addModalOpen]);

  const todayStr = toDateStr(new Date());
  const days: string[] = [];
  const start = new Date(todayStr + "T12:00:00");
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(toDateStr(d));
  }
  const windowStart = days[0];
  const windowEnd = days[13];

  const intakes = getIntakesForDay(data.medications, selectedDate, windowStart, windowEnd);
  const hasIntakesOnDay = (dateStr: string) =>
    getIntakesForDay(data.medications, dateStr, windowStart, windowEnd).length > 0;

  const toggleTaken = (dateStr: string, intakeKey: string) => {
    setData((prev) => ({
      ...prev,
      taken: {
        ...prev.taken,
        [dateStr]: {
          ...prev.taken[dateStr],
          [intakeKey]: !prev.taken[dateStr]?.[intakeKey],
        },
      },
    }));
  };

  const isTaken = (dateStr: string, intakeKey: string) => !!data.taken[dateStr]?.[intakeKey];

  if (!userId) return null;

  return (
    <div className="min-h-0">
      {/* 14-day horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {days.map((dateStr) => {
          const d = new Date(dateStr + "T12:00:00");
          const dayLabel = dayLabels[d.getDay()] ?? "";
          const dayNum = d.getDate();
          const active = selectedDate === dateStr;
          const hasIntake = hasIntakesOnDay(dateStr);
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`flex h-[88px] w-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 transition-all ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              <span className="text-[10px] font-medium">{dayLabel}</span>
              <span className="text-base font-semibold">{dayNum}</span>
              {hasIntake && (
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-status-green" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      {/* List for selected date */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="mt-4 space-y-2 px-1"
        >
          {intakes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("profile.noIntakesForDate")}
            </p>
          ) : (
            intakes.map(({ med, intakeKey }) => (
              <Card key={intakeKey} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground">{med.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {med.time} • {t("profile.medicationQty")}: {med.quantity}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isTaken(selectedDate, intakeKey) ? "secondary" : "outline"}
                      className="shrink-0"
                      onClick={() => toggleTaken(selectedDate, intakeKey)}
                    >
                      {isTaken(selectedDate, intakeKey) ? t("profile.taken") : t("profile.take")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Sticky add button above bottom nav */}
      <div className="sticky bottom-20 px-4 pb-6 pt-4">
        <Button className="w-full rounded-full" onClick={() => setAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("profile.addMedication")}
        </Button>
      </div>

      <AddMedicationModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        selectedDate={selectedDate}
        onSave={(med) => {
          setData((prev) => ({
            ...prev,
            medications: [...prev.medications, { ...med, id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` }],
          }));
          setAddModalOpen(false);
        }}
      />
    </div>
  );
}

function AddMedicationModal({
  open,
  onClose,
  selectedDate,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  onSave: (med: Omit<Medication, "id">) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [time, setTime] = useState("08:00");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "once">("daily");
  const [startDate, setStartDate] = useState(() => toDateStr(new Date()));

  useEffect(() => {
    if (open) {
      setName("");
      setTime("08:00");
      setQuantity(1);
      setFrequency("daily");
      setStartDate(selectedDate);
    }
  }, [open, selectedDate]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const dateToUse = frequency === "once" ? selectedDate : startDate;
    onSave({
      name: trimmedName,
      time: time.trim() || "08:00",
      quantity: Number(quantity) || 1,
      frequency,
      startDate: dateToUse,
    });
  };

  return (
    <FullscreenModal open={open} onClose={onClose}>
      <div 
        className="flex h-full w-full flex-col"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center px-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted -ml-2"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="ml-2 text-base font-semibold text-foreground">
            {t("profile.addMedication")}
          </h2>
        </header>

        {/* Content */}
        <div 
          className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5"
          style={{ paddingBottom: 100 }}
        >
          <div className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground">{t("profile.medicationName")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.placeholderMedication")}
                className="mt-1.5 h-12 rounded-xl border-border bg-card text-base"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("profile.medicationTime")}</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1.5 h-12 rounded-xl border-border bg-card text-base text-left"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("profile.medicationQty")}</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="mt-1.5 h-12 rounded-xl border-border bg-card text-base"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t("profile.medicationFreq")}</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as "daily" | "weekly" | "once")}>
                <SelectTrigger className="mt-1.5 h-12 rounded-xl border-border bg-card text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100000]">
                  {FREQUENCY_VALUES.map((val) => (
                    <SelectItem key={val} value={val}>
                      {t(`profile.freq${val.charAt(0).toUpperCase() + val.slice(1)}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {frequency !== "once" && (
              <div>
                <Label className="text-xs text-muted-foreground">{t("profile.medicationStartDate")}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl border-border bg-card text-base text-left"
                />
              </div>
            )}
          </div>
        </div>

        {/* Fixed button */}
        <div 
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div 
            className="pointer-events-auto px-5 pb-4 pt-8"
            style={{ background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent 100%)" }}
          >
            <Button className="w-full h-14 rounded-[18px] text-base font-medium" onClick={handleSave}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </FullscreenModal>
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

type EditableField = "firstName" | "lastName" | "email" | "dob" | "height" | "weight" | "goal";

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { validateName, validateEmail, validateHeight, validateWeight } = useValidation();
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
  const [profileTab, setProfileTab] = useState<"medical" | "history" | "subscriptions" | "medications">("medical");
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
    activityLevel: user?.activityLevel?.trim() ?? "",
    height: user?.height != null ? String(user.height) : "",
    weight: user?.weight != null ? String(user.weight) : "",
    goal: user?.goal ? t(`health.goal${user.goal === "gain" ? "Gain" : user.goal === "maintain" ? "Maintain" : "Lose"}`) : "",
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
    else if (field === "height") err = validateHeight(editDraft) as string | null;
    else if (field === "weight") err = validateWeight(editDraft) as string | null;
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
    { key: "firstName", label: t("profile.firstName"), value: profileDisplay.firstName || "—", icon: User, editable: true },
    { key: "lastName", label: t("profile.lastName"), value: profileDisplay.lastName || "—", icon: User, editable: true },
    { key: "email", label: t("profile.email"), value: profileDisplay.email || "—", icon: Mail, editable: true },
    { key: "dob", label: t("profile.dob"), value: formatDateRu(profileDisplay.dob) || "—", icon: Calendar, editable: true },
    { key: "height", label: t("profile.height"), value: profileDisplay.height ? `${profileDisplay.height} см` : "—", icon: Ruler, editable: true },
    { key: "weight", label: t("profile.weight"), value: profileDisplay.weight ? `${profileDisplay.weight} кг` : "—", icon: Scale, editable: true },
    { key: "activity", label: t("profile.activityLevel"), value: profileDisplay.activityLevel || "—", icon: Activity, editable: false },
    { key: "goal", label: t("profile.nutritionGoal"), value: profileDisplay.goal || "—", icon: Target, editable: true },
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
              {getInitials(profileDisplay.fullName || t("profile.placeholderName"))}
            </AvatarFallback>
          </Avatar>
        </label>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-lg font-semibold tracking-tight text-foreground">
              {(profileDisplay.firstName || profileDisplay.lastName)
                ? `${profileDisplay.firstName || ""} ${profileDisplay.lastName || ""}`.trim()
                : t("profile.placeholderName")}
            </span>
            {user?.isVerified && (
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <span className="text-[10px] font-bold text-primary-foreground">✓</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {user?.nickname
              ? `@${user.nickname.replace(/[^a-zA-Z0-9_.]/g, "") || "user"}`
              : t("profile.placeholderNickname")}
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            {user?.dob && (
              <span>
                {calculateAge(user.dob)} {t("profile.years")}
              </span>
            )}
            {user?.city && (
              <span>
                {" • "}
                {CITY_KEYS.includes(user.city as typeof CITY_KEYS[number]) ? t(`cities.${user.city}`) : user.city}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action buttons (one line, like Threads) */}
      <motion.div variants={item} className="mt-4 flex gap-3">
        <Button className="flex-1" onClick={() => setEditOpen(true)}>
          {t("profile.editProfile")}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setBookingOpen(true)}>
          {t("profile.book")}
        </Button>
      </motion.div>

      {/* Tabs: Медкарта | Записи | Продукты | Лекарства */}
      <motion.div variants={item} className="mt-6 border-b border-border">
        <div className="flex">
          {[
            { key: "medical" as const, labelKey: "profile.medical" },
            { key: "history" as const, labelKey: "profile.history" },
            { key: "subscriptions" as const, labelKey: "profile.subscriptions" },
            { key: "medications" as const, labelKey: "profile.medications" },
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
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab content */}
      <motion.div variants={item} className="mt-4 space-y-4">
        <AnimatePresence mode="wait">
          {profileTab === "medical" && (
            <motion.div key="medical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <MedicalTab />
            </motion.div>
          )}
          {profileTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <HistoryTab />
            </motion.div>
          )}
          {profileTab === "subscriptions" && (
            <motion.div key="subscriptions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <SubscriptionsTab />
            </motion.div>
          )}
          {profileTab === "medications" && (
            <motion.div key="medications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <MedicationsTab userId={user?.id ?? ""} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Тарифы — отдельная секция внизу */}
      <motion.div variants={item} className="mt-8">
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("profile.tariffs")}
          </h2>
          <Card className="border border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">{t("profile.premium")}</div>
                  <div className="text-xs text-muted-foreground">{t("profile.pricePerMonth")}</div>
                </div>
                <Button size="sm">{t("profile.connect")}</Button>
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
              {modal === "fullName" && t("profile.firstName")}
              {modal === "email" && t("profile.email")}
              {modal === "dob" && t("profile.dob")}
              {modal === "activity" && t("profile.activityLevel")}
              {modal === "lab" && modalPayload?.labItem}
              {modal === "setting" && modalPayload?.settingLabel}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {modal === "lab" && (
                <span className="block pt-1">{t("profile.modalComingSoon")}</span>
              )}
              {modal === "setting" && (
                <span className="block pt-1">{t("profile.modalDemo")}</span>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Booking popup */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="border border-border bg-card">
          <DialogHeader>
            <DialogTitle>{t("profile.bookingTitle")}</DialogTitle>
            <DialogDescription>
              {t("profile.bookingDesc")}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Full-screen edit profile panel - rendered via Portal at document.body */}
      <FullscreenModal open={editOpen} onClose={() => setEditOpen(false)}>
        {/* Main container - centered with max width */}
        <div 
          className="mx-auto flex h-full max-w-[480px] w-full flex-col overflow-hidden"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* Header with close button */}
          <header className="flex h-14 shrink-0 items-center px-5">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted -ml-2"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="ml-2 text-base font-semibold text-foreground">
              {t("profile.editProfile")}
            </h2>
          </header>

          {/* Scrollable content */}
          <div 
            className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
            style={{ paddingBottom: 120 }}
          >
            <div className="px-5">
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <Label htmlFor="edit-firstName" className="text-xs text-muted-foreground">
                    {t("profile.firstName")}
                  </Label>
                  <Input
                    id="edit-firstName"
                    value={editFirstName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditFirstName(v);
                      updateUser({ firstName: v });
                    }}
                    className="mt-1.5 h-14 w-full max-w-full rounded-2xl border-border bg-card px-4 text-base text-left box-border"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="edit-lastName" className="text-xs text-muted-foreground">
                    {t("profile.lastName")}
                  </Label>
                  <Input
                    id="edit-lastName"
                    value={editLastName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditLastName(v);
                      updateUser({ lastName: v });
                    }}
                    className="mt-1.5 h-14 w-full max-w-full rounded-2xl border-border bg-card px-4 text-base text-left box-border"
                  />
                </div>

                {/* Nickname */}
                <div>
                  <Label htmlFor="edit-nickname" className="text-xs text-muted-foreground">
                    {t("auth.nickname")}
                  </Label>
                  <Input
                    id="edit-nickname"
                    value={editNickname}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const sanitized = raw.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                      setEditNickname(sanitized);
                      updateUser({ nickname: sanitized });
                    }}
                    className="mt-1.5 h-14 w-full max-w-full rounded-2xl border-border bg-card px-4 text-base text-left box-border"
                    placeholder={t("profile.placeholderUsername")}
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <Label htmlFor="edit-dob" className="text-xs text-muted-foreground">
                    {t("profile.dob")}
                  </Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={editDob}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditDob(v);
                      updateUser({ dob: v });
                    }}
                    className="mt-1.5 h-14 w-full max-w-full rounded-2xl border-border bg-card px-4 text-base text-left box-border appearance-none [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-date-and-time-value]:text-left"
                  />
                </div>

                {/* Age (readonly) */}
                <div>
                  <Label htmlFor="edit-age" className="text-xs text-muted-foreground">
                    {t("profile.age")}
                  </Label>
                  <Input
                    id="edit-age"
                    value={editAge}
                    readOnly
                    className="mt-1.5 h-14 w-full max-w-full rounded-2xl border-border bg-muted px-4 text-base text-left text-muted-foreground box-border"
                  />
                </div>

                {/* Height & Weight in 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-height" className="text-xs text-muted-foreground">
                      {t("profile.height")} (см)
                    </Label>
                    <Input
                      id="edit-height"
                      type="number"
                      inputMode="numeric"
                      min={120}
                      max={220}
                      value={editHeight}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditHeight(v);
                        const n = Number(v);
                        if (!Number.isNaN(n)) updateUser({ height: n });
                      }}
                      className="mt-1.5 h-14 w-full max-w-full rounded-2xl border-border bg-card px-4 text-base text-left box-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-weight" className="text-xs text-muted-foreground">
                      {t("profile.weight")} (кг)
                    </Label>
                    <Input
                      id="edit-weight"
                      type="number"
                      inputMode="numeric"
                      min={40}
                      max={200}
                      value={editWeight}
                      onChange={(e) => {
                        const v = e.target.value;
                        setEditWeight(v);
                        const n = Number(v);
                        if (!Number.isNaN(n)) updateUser({ weight: n });
                      }}
                      className="mt-1.5 h-14 w-full max-w-full rounded-2xl border-border bg-card px-4 text-base text-left box-border"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <Label htmlFor="edit-city" className="text-xs text-muted-foreground">
                    {t("profile.city")}
                  </Label>
                  <Select
                    value={editCity}
                    onValueChange={(v) => {
                      setEditCity(v);
                      updateUser({ city: v });
                    }}
                  >
                    <SelectTrigger
                      id="edit-city"
                      className="mt-1.5 h-14 w-full max-w-full rounded-2xl border-border bg-card px-4 text-base text-left box-border"
                    >
                      <SelectValue placeholder={t("profile.chooseCity")} />
                    </SelectTrigger>
                    <SelectContent className="z-[100000] border-border bg-popover" position="popper">
                      {CITY_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`cities.${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed bottom save button */}
          <div 
            className="pointer-events-none absolute bottom-0 left-0 right-0"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div 
              className="mx-auto max-w-[480px] px-5 pb-4 pt-8 pointer-events-auto"
              style={{ background: "linear-gradient(to top, hsl(var(--background)) 60%, transparent 100%)" }}
            >
              <Button
                className="h-14 w-full rounded-[18px] text-base font-medium"
                onClick={() => setEditOpen(false)}
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      </FullscreenModal>
    </motion.div>
  );
};

export default Profile;
