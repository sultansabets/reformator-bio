import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Settings } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ensureDailyReset } from "@/lib/dailyReset";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import BottomNav from "./BottomNav";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

const AppLayout = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    ensureDailyReset();
  }, []);

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
          <div className="pt-2">
            <h2 className="text-lg font-semibold text-foreground">Настройки</h2>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(false);
                navigate("/profile");
              }}
              className="mt-4 flex w-full items-center rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Профиль
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
