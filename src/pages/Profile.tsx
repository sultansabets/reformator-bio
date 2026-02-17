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
  Pill,
  Plus,
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
                  ? "text-status-green"
                  : item.status === "планируется"
                  ? "text-primary"
                  : item.status === "не пришел"
                  ? "text-status-red"
                  : "text-status-amber"
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

// --- Medications tab: types and storage ---
type Medication = {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  startDate: string;
  endDate: string;
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
    return {
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
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

function isMedicationActiveOnDate(med: Medication, dateStr: string): boolean {
  return dateStr >= med.startDate && dateStr <= med.endDate;
}

function getIntakesForDay(medications: Medication[], dateStr: string): { med: Medication; time: string; intakeKey: string }[] {
  const out: { med: Medication; time: string; intakeKey: string }[] = [];
  for (const med of medications) {
    if (!isMedicationActiveOnDate(med, dateStr)) continue;
    for (const time of med.times) {
      if (!time?.trim()) continue;
      out.push({ med, time: time.trim(), intakeKey: `${med.id}_${time.trim()}` });
    }
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

function MedicationsTab({ userId }: { userId: string }) {
  const [data, setData] = useState<MedicationsData>(() => loadMedicationsData(userId));
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateStr(new Date()));
  const [addModalOpen, setAddModalOpen] = useState(false);

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
  const start = new Date(todayStr);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(toDateStr(d));
  }

  const intakes = getIntakesForDay(data.medications, selectedDate);
  const hasIntakesOnDay = (dateStr: string) => getIntakesForDay(data.medications, dateStr).length > 0;

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

  const emptyState = data.medications.length === 0;

  return (
    <div className="pb-24">
      {/* 7-day horizontal calendar */}
      <motion.div
        className="flex gap-2 overflow-x-auto scrollbar-hide py-2"
        style={{ WebkitOverflowScrolling: "touch" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          const threshold = 40;
          if (info.offset.x < -threshold && days.indexOf(selectedDate) < 6) {
            setSelectedDate(days[days.indexOf(selectedDate) + 1]);
          } else if (info.offset.x > threshold && days.indexOf(selectedDate) > 0) {
            setSelectedDate(days[days.indexOf(selectedDate) - 1]);
          }
        }}
      >
        {days.map((dateStr) => {
          const d = new Date(dateStr + "T12:00:00");
          const dayLabel = DAY_LABELS[d.getDay()];
          const dayNum = d.getDate();
          const active = selectedDate === dateStr;
          const hasIntake = hasIntakesOnDay(dateStr);
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`flex shrink-0 flex-col items-center rounded-xl border-2 px-3 py-2.5 transition-all ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              <span className="text-[10px] font-medium">{dayLabel}</span>
              <span className="text-base font-semibold">{dayNum}</span>
              {hasIntake && (
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
              )}
            </button>
          );
        })}
      </motion.div>

      {emptyState ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex flex-col items-center justify-center py-12 text-center"
          >
            <Pill className="h-12 w-12 text-muted-foreground/60" strokeWidth={1.5} />
            <h3 className="mt-4 text-sm font-semibold text-foreground">Нет курсов лекарств</h3>
            <p className="mt-1 text-xs text-muted-foreground">Добавьте ваше первое лекарство</p>
          </motion.div>
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 safe-area-pb">
            <Button className="w-full" onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Button>
          </div>
        </>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-4 space-y-2"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Приёмы на {new Date(selectedDate + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
              </p>
              {intakes.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">Нет приёмов на этот день</p>
              ) : (
                intakes.map(({ med, time, intakeKey }) => (
                  <Card key={intakeKey} className="border border-border">
                    <CardContent className="p-0">
                      <button
                        type="button"
                        onClick={() => toggleTaken(selectedDate, intakeKey)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <div>
                          <div className="text-sm font-semibold text-foreground">{med.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {med.dosage} • {time}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            isTaken(selectedDate, intakeKey) ? "text-status-green" : "text-muted-foreground"
                          }`}
                        >
                          {isTaken(selectedDate, intakeKey) ? "Принято" : "Отметить"}
                        </span>
                      </button>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          </AnimatePresence>
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 safe-area-pb">
            <Button className="w-full" onClick={() => setAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Button>
          </div>
        </>
      )}

      <AddMedicationModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
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
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (med: Omit<Medication, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [startDate, setStartDate] = useState(() => toDateStr(new Date()));
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDosage("");
      setTimes(["08:00"]);
      setStartDate(toDateStr(new Date()));
      setEndDate("");
    }
  }, [open]);

  const addTime = () => setTimes((t) => [...t, "12:00"]);
  const removeTime = (i: number) => setTimes((t) => t.filter((_, idx) => idx !== i));
  const setTime = (i: number, v: string) => setTimes((t) => t.map((val, idx) => (idx === i ? v : val)));

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const trimmedTimes = times.map((t) => t.trim()).filter(Boolean);
    if (trimmedTimes.length === 0) return;
    const end = endDate.trim();
    const endDateValue = end || (() => {
      const d = new Date(startDate + "T12:00:00");
      d.setFullYear(d.getFullYear() + 10);
      return toDateStr(d);
    })();
    onSave({
      name: trimmedName,
      dosage: dosage.trim(),
      times: trimmedTimes,
      startDate,
      endDate: endDateValue,
    });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col overflow-x-hidden bg-background"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold text-foreground">Добавить лекарство</h2>
          <button type="button" onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted" aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Витамин D" className="h-11 border-border" />
          </div>
          <div className="space-y-2">
            <Label>Дозировка</Label>
            <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Например: 2000 МЕ" className="h-11 border-border" />
          </div>
          <div className="space-y-2">
            <Label>Время приёма</Label>
            {times.map((t, i) => (
              <div key={i} className="flex gap-2">
                <Input type="time" value={t} onChange={(e) => setTime(i, e.target.value)} className="h-11 border-border flex-1" />
                {times.length > 1 ? (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeTime(i)} className="shrink-0" aria-label="Удалить время">
                    —
                  </Button>
                ) : null}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addTime} className="w-full">
              + Добавить время
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Дата начала</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 border-border" />
          </div>
          <div className="space-y-2">
            <Label>Дата окончания</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Не ограничено" className="h-11 border-border" />
          </div>
        </div>
        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
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
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <span className="text-[10px] font-bold text-primary-foreground">✓</span>
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

      {/* Tabs: Медкарта | Записи | Продукты | Лекарства */}
      <motion.div variants={item} className="mt-6 border-b border-border">
        <div className="flex">
          {[
            { key: "medical" as const, label: "Медкарта" },
            { key: "history" as const, label: "Записи" },
            { key: "subscriptions" as const, label: "Продукты" },
            { key: "medications" as const, label: "Лекарства" },
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
