import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Settings, Moon, Globe, HelpCircle, FileText, Info, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ensureDailyReset } from "@/lib/dailyReset";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import BottomNav from "./BottomNav";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

const LANG_OPTIONS = [
  { id: "ru", label: "Русский" },
  { id: "kk", label: "Казахский" },
  { id: "en", label: "Английский" },
] as const;

const AppLayout = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState<string>("ru");

  useEffect(() => {
    ensureDailyReset();
  }, []);

  const handleLogout = () => {
    setSettingsOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

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
            onClick={() => navigate("/notifications")}
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
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                navigate("/profile");
              }}
              className="mt-4 flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Профиль
            </button>
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
    </div>
  );
};

export default AppLayout;
