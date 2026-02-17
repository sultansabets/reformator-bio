import { Home, Zap, Sparkles, ShoppingBag, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LEFT_TABS = [
  { path: "/control", icon: Home, ariaLabel: "Главная" },
  { path: "/center", icon: Zap, ariaLabel: "Центр" },
];
const AI_PATH = "/ai";
const RIGHT_TABS = [
  { path: "/shop", icon: ShoppingBag, ariaLabel: "Магазин" },
  { path: "/profile", icon: User, ariaLabel: "Профиль", useAvatar: true },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleAIClick = () => {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
    navigate(AI_PATH);
  };

  const renderTab = (
    tab: { path: string; icon: typeof Home; ariaLabel: string; useAvatar?: boolean },
    isActive: boolean
  ) => {
    const showAvatar = tab.useAvatar && user?.avatar;
    const Icon = tab.icon;
    return (
      <button
        key={tab.path}
        onClick={() => navigate(tab.path)}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg p-2 transition-colors duration-200",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
        aria-label={tab.ariaLabel}
      >
        {showAvatar ? (
          <Avatar className="h-7 w-7 border-2 border-transparent ring-0">
            <AvatarImage src={user?.avatar} alt="" />
            <AvatarFallback className="bg-primary text-[10px] font-medium text-primary-foreground">
              {user?.fullName?.slice(0, 1)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.8} />
        )}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {LEFT_TABS.map((tab) => renderTab(tab, location.pathname === tab.path))}

        <button
          onClick={handleAIClick}
          className={cn(
            "flex h-16 w-16 -translate-y-5 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95",
            "bg-indigo-600 dark:bg-indigo-500 text-white",
            "shadow-lg shadow-indigo-500/25 dark:shadow-indigo-400/20",
            "ring-4 ring-background/80",
            "animate-[pulse_2.5s_ease-in-out_infinite] hover:animate-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-background"
          )}
          aria-label="ИИ"
        >
          <Sparkles className="h-7 w-7" strokeWidth={2} />
        </button>

        {RIGHT_TABS.map((tab) => renderTab(tab, location.pathname === tab.path))}
      </div>
    </nav>
  );
};

export default BottomNav;
