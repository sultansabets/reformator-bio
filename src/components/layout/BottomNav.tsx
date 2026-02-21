import { Home, Zap, ShoppingBag, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ParticleButton } from "./ParticleButton";

const LEFT_TABS = [
  { path: "/control", icon: Home, key: "tabs.home" },
  { path: "/center", icon: Zap, key: "tabs.center" },
];
const AI_PATH = "/ai";
const RIGHT_TABS = [
  { path: "/shop", icon: ShoppingBag, key: "tabs.store" },
  { path: "/profile", icon: User, key: "tabs.profile", useAvatar: true },
];

type BottomNavProps = {
  visible?: boolean;
};

const BottomNav = ({ visible = true }: BottomNavProps) => {
  const { t } = useTranslation();
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
    tab: { path: string; icon: typeof Home; key: string; useAvatar?: boolean },
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
        aria-label={t(tab.key)}
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {LEFT_TABS.map((tab) => renderTab(tab, location.pathname === tab.path))}

        <button
          onClick={handleAIClick}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-800 overflow-hidden transition-transform duration-200 active:scale-95 focus:outline-none"
          aria-label={t("tabs.ai")}
        >
          <ParticleButton size={40} />
        </button>

        {RIGHT_TABS.map((tab) => renderTab(tab, location.pathname === tab.path))}
      </div>
    </nav>
  );
};

export default BottomNav;
