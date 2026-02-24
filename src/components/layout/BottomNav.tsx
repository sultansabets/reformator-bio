import { Home, ShoppingBag, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ParticlesIcon } from "@/components/ParticlesIcon";
import { CenterIcon } from "@/components/CenterIcon";

const LEFT_TABS = [
  { path: "/control", icon: Home, key: "tabs.home" },
  { path: "/center", customIcon: CenterIcon, key: "tabs.center" },
];
const AI_PATH = "/ai";
const RIGHT_TABS = [
  { path: "/shop", icon: ShoppingBag, key: "tabs.store" },
  { path: "/profile", icon: User, key: "tabs.profile", useAvatar: true },
];

const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleAIClick = () => {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
    navigate(AI_PATH, { state: { from: location.pathname } });
  };

  const renderTab = (
    tab: {
      path: string;
      icon?: typeof Home;
      customIcon?: React.ComponentType<{ active?: boolean; className?: string }>;
      key: string;
      useAvatar?: boolean;
    },
    isActive: boolean
  ) => {
    const showAvatar = tab.useAvatar && user?.avatar;
    const Icon = tab.icon;
    const CustomIcon = tab.customIcon;
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
        ) : CustomIcon ? (
          <CustomIcon active={isActive} className="h-6 w-6" />
        ) : Icon ? (
          <Icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.8} />
        ) : null}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 shrink-0 border-t border-border dark:border-0 dark:border-transparent bg-background">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {LEFT_TABS.map((tab) => renderTab(tab, location.pathname === tab.path))}

        <button
          onClick={handleAIClick}
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-95 focus:outline-none",
            location.pathname === AI_PATH ? "text-white" : "text-muted-foreground"
          )}
          aria-label={t("tabs.ai")}
        >
          <ParticlesIcon size={40} active={location.pathname === AI_PATH} className="pointer-events-none" />
        </button>

        {RIGHT_TABS.map((tab) => renderTab(tab, location.pathname === tab.path))}
      </div>
    </nav>
  );
};

export default BottomNav;
