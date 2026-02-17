import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Settings, Moon, Globe, HelpCircle, FileText, Info, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ensureDailyReset } from "@/lib/dailyReset";
import { getNotificationsEnabled, setNotificationsEnabled } from "@/lib/notifications";
import NotificationBottomSheet from "@/components/notifications/NotificationBottomSheet";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import { getNotifications, setNotifications, seedMockIfEmpty, type Notification } from "@/lib/notifications";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BottomNav from "./BottomNav";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

const LANG_OPTIONS = [
  { id: "ru", label: "Русский" },
  { id: "kk", label: "Қазақша" },
  { id: "en", label: "English" },
] as const;

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

const AppLayout = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout, user, updateUser } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState<string>("ru");
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationList, setNotificationList] = useState<Notification[]>(() => getNotifications());
  const [personalOpen, setPersonalOpen] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    ensureDailyReset(user?.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setNickname(user.nickname ?? "");
    setDob(user.dob ?? "");
    setHeight(user.height != null ? String(user.height) : "");
    setWeight(user.weight != null ? String(user.weight) : "");
    setCity(user.city ?? "");
  }, [user]);

  useEffect(() => {
    setNotificationsEnabledState(getNotificationsEnabled());
  }, []);

  useEffect(() => {
    // keep local list in sync (used for modal)
    setNotificationList(getNotifications());
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    // seed only when modal first opens and notifications are enabled
    seedMockIfEmpty();
    setNotificationList(getNotifications());
  }, [notificationsOpen]);

  const handleLogout = () => {
    setSettingsOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const age = useMemo(() => {
    if (!dob) return "";
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    let years = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
      years -= 1;
    }
    return years >= 0 ? String(years) : "";
  }, [dob]);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background transition-colors duration-300">
      <header
        className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4"
      >
        <div className="flex items-center">
          <img
            src={theme === "dark" ? logoDark : logoLight}
            alt="Reformator Bio Logo"
            className="h-6 w-auto object-contain md:h-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Уведомления"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen((prev) => !prev)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Настройки"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-border bg-background sm:max-w-sm"
        >
          <div className="pt-2 pb-6">
            <h2 className="text-lg font-semibold text-foreground">Настройки</h2>
            <div className="mt-4 space-y-1 rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Тема</span>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  aria-label="День / ночь"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Уведомления</span>
                </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  setNotificationsEnabledState(checked);
                  setNotificationsEnabled(checked);
                }}
                aria-label="Включить уведомления"
              />
              </div>
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Язык</span>
                </div>
                <div className="flex gap-2 mt-1">
                  {LANG_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setLang(o.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        lang === o.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Личные данные */}
            <div className="mt-4">
              <Collapsible open={personalOpen} onOpenChange={setPersonalOpen}>
                <Card className="border border-border bg-card">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <span>Личные данные</span>
                      <svg
                        className={`h-4 w-4 text-muted-foreground transition-transform ${personalOpen ? "rotate-180" : ""}`}
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 7.5L10 12.5L15 7.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="firstName">Имя</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFirstName(v);
                              updateUser({ firstName: v });
                            }}
                            className="mt-1 border-border bg-background"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Фамилия</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLastName(v);
                              updateUser({ lastName: v });
                            }}
                            className="mt-1 border-border bg-background"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="nickname">Никнейм</Label>
                        <Input
                          id="nickname"
                          value={nickname}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const sanitized = raw.toLowerCase().replace(/[^a-z0-9_.]/g, "");
                            setNickname(sanitized);
                            updateUser({ nickname: sanitized });
                          }}
                          className="mt-1 border-border bg-background"
                          placeholder="username"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="dob">Дата рождения</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={dob}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDob(v);
                              updateUser({ dob: v });
                            }}
                            className="mt-1 border-border bg-background"
                          />
                        </div>
                        <div>
                          <Label htmlFor="age">Возраст</Label>
                          <Input
                            id="age"
                            value={age}
                            readOnly
                            className="mt-1 border-border bg-background"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="height">Рост (см)</Label>
                          <Input
                            id="height"
                            type="number"
                            min={120}
                            max={220}
                            value={height}
                            onChange={(e) => {
                              const v = e.target.value;
                              setHeight(v);
                              const n = Number(v);
                              if (!Number.isNaN(n)) {
                                updateUser({ height: n });
                              }
                            }}
                            className="mt-1 border-border bg-background"
                          />
                        </div>
                        <div>
                          <Label htmlFor="weight">Вес (кг)</Label>
                          <Input
                            id="weight"
                            type="number"
                            min={40}
                            max={200}
                            value={weight}
                            onChange={(e) => {
                              const v = e.target.value;
                              setWeight(v);
                              const n = Number(v);
                              if (!Number.isNaN(n)) {
                                updateUser({ weight: n });
                              }
                            }}
                            className="mt-1 border-border bg-background"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="city">Город</Label>
                        <Select
                          value={city}
                          onValueChange={(v) => {
                            setCity(v);
                            updateUser({ city: v });
                          }}
                        >
                          <SelectTrigger
                            id="city"
                            className="mt-1 border-border bg-background"
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
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
            {/* Купить тариф */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">Купить тариф</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-card px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">Starter</p>
                  <p className="mt-1 text-xs text-muted-foreground">$9 / месяц</p>
                </div>
                <div className="rounded-lg border border-border bg-card px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">Pro</p>
                  <p className="mt-1 text-xs text-muted-foreground">$29 / месяц</p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Помощь и поддержка
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                Политика конфиденциальности
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
                О приложении
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <main className="pb-20 transition-colors duration-300">
        <Outlet />
      </main>
      <BottomNav />
      <NotificationBottomSheet open={notificationsOpen} onClose={() => setNotificationsOpen(false)}>
        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <header className="flex items-center justify-between px-4 pb-2">
            <h1 className="text-lg font-semibold text-foreground">Уведомления</h1>
          </header>
          {!notificationsEnabled && (
            <p className="px-4 pb-1 text-xs text-muted-foreground">Уведомления отключены</p>
          )}
          <NotificationPanel
            notifications={notificationList}
            onMarkRead={(id) => {
              const next = notificationList.map((n) =>
                n.id === id ? { ...n, read: true } : n
              );
              setNotificationList(next);
              setNotifications(next);
            }}
            hideTitle
          />
        </div>
      </NotificationBottomSheet>
    </div>
  );
};

export default AppLayout;
