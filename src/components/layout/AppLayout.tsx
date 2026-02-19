import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Settings, Sun, Moon, Globe, HelpCircle, FileText, Info, LogOut, Watch, ChevronRight, ChevronDown } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ensureDailyReset } from "@/lib/dailyReset";
import { getNotificationsEnabled, setNotificationsEnabled } from "@/lib/notifications";
import { getNotifications, setNotifications, seedMockIfEmpty, type Notification } from "@/lib/notifications";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import BottomNav from "./BottomNav";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { LANGUAGES, persistLanguage } from "@/i18n";

const SETTINGS_DEVICE_IDS = ["apple", "reformator-band"] as const;

function buildSettingsDevices(
  wearable: string | undefined,
  t: (key: string) => string
): { id: string; name: string; connected: boolean; lastSync: string; battery: string }[] {
  return SETTINGS_DEVICE_IDS.map((id) => ({
    id,
    name: id === "apple" ? t("settings.appleWatch") : t("settings.reformatorBand"),
    connected: wearable === id,
    lastSync: wearable === id ? t("settings.syncedAgo") : "—",
    battery: wearable === id ? "85%" : "—",
  }));
}

const AppLayout = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout, user, updateUser } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationList, setNotificationList] = useState<Notification[]>(() => getNotifications());
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [deviceModal, setDeviceModal] = useState<{ id: string; name: string; connected: boolean; lastSync: string; battery: string } | null>(null);
  const settingsDevices = useMemo(() => buildSettingsDevices(user?.wearable, t), [user?.wearable, t]);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    persistLanguage(code);
  };

  useEffect(() => {
    ensureDailyReset(user?.id);
  }, [user?.id]);

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

  return (
    <div className="mx-auto min-h-screen max-w-md overflow-x-visible overflow-y-auto bg-background transition-colors duration-300">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="relative flex h-14 items-center justify-between px-4">
          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              aria-label={t("settings.ariaTheme")}
            >
              {theme === "light" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <img
              src={theme === "dark" ? logoDark : logoLight}
              alt="Reformator Bio Logo"
              className="h-5 w-auto flex-shrink-0 object-contain md:h-6"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              aria-label={t("settings.ariaNotifications")}
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
              aria-label={t("settings.ariaSettings")}
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="h-screen w-full flex flex-col border-border bg-background p-0 sm:max-w-sm"
        >
          <div className="flex-1 overflow-y-auto px-4 pb-24 pt-14">
            <h2 className="text-lg font-semibold text-foreground">{t("settings.title")}</h2>
            <div className="mt-4 space-y-1 rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("settings.theme")}</span>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  aria-label={t("settings.themeToggle")}
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("settings.notifications")}</span>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) => {
                    setNotificationsEnabledState(checked);
                    setNotificationsEnabled(checked);
                  }}
                  aria-label={t("settings.notificationsEnable")}
                />
              </div>
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t("settings.language")}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {LANGUAGES.map((o) => (
                    <button
                      key={o.code}
                      type="button"
                      onClick={() => handleLanguageChange(o.code)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        i18n.language === o.code ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Подключенные устройства */}
            <div className="mt-4">
              <Collapsible open={devicesOpen} onOpenChange={setDevicesOpen}>
                <Card className="border border-border bg-card">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Watch className="h-4 w-4 text-muted-foreground" />
                        <span>{t("settings.devices")}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${devicesOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-0 pt-1">
                      <div className="space-y-1">
                        {settingsDevices.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDeviceModal(d)}
                            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40"
                          >
                            <Watch className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-foreground">{d.name}</span>
                              <span className="ml-2">
                                <Badge
                                  variant={d.connected ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {d.connected ? t("settings.connected") : t("settings.notConnected")}
                                </Badge>
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            </div>
            <div className="mt-4 space-y-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                {t("settings.help")}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t("settings.privacy")}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
                {t("settings.about")}
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              {t("auth.logout")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <Dialog open={deviceModal !== null} onOpenChange={(open) => !open && setDeviceModal(null)}>
        <DialogContent className="max-w-[340px] border border-border bg-card p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {deviceModal?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {deviceModal && (
                <span className="block pt-1">
                  {t("settings.status")}: {deviceModal.connected ? t("settings.connected") : t("settings.notConnected")}
                  <br />
                  {t("settings.sync")}: {deviceModal.lastSync}
                  <br />
                  {t("settings.charge")}: {deviceModal.battery}
                  {deviceModal.id === "apple" && !deviceModal.connected && (
                    <>
                      <br />
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        onClick={() => {
                          const grant = window.confirm(t("settings.healthAccess"));
                          if (grant) updateUser({ wearable: "apple" });
                          setDeviceModal(null);
                        }}
                      >
                        {t("common.connect")}
                      </Button>
                    </>
                  )}
                  {deviceModal.id === "reformator-band" && !deviceModal.connected && (
                    <p className="mt-2 text-xs">{t("settings.connectionUnavailable")}</p>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <main className="pb-20 transition-colors duration-300">
        <Outlet />
      </main>
      <BottomNav />

      {/* Уведомления: fullscreen Sheet справа налево */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent
          side="right"
          className="h-screen w-full max-w-full overflow-y-auto border-border bg-background p-0 sm:max-w-md"
        >
          <div className="flex flex-col h-full">
            <div className="shrink-0 border-b border-border px-4 pt-14 pb-4">
              <h2 className="text-lg font-semibold text-foreground">{t("notifications.title")}</h2>
              {!notificationsEnabled && (
                <p className="mt-1 text-xs text-muted-foreground">{t("settings.notificationsOff")}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {notificationList.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("settings.noNotifications")}</p>
              ) : (
                notificationList.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-border py-4"
                  >
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AppLayout;
