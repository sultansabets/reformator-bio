import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ParticlesIcon } from "@/components/ParticlesIcon";
import {
  HomeOutlineIcon,
  HomeFilledIcon,
  CenterOutlineIcon,
  CenterFilledIcon,
  ShopOutlineIcon,
  ShopFilledIcon,
  ProfileOutlineIcon,
  ProfileFilledIcon,
} from "@/components/icons/nav";

const TABS = [
  { path: "/control", OutlineIcon: HomeOutlineIcon, FilledIcon: HomeFilledIcon, key: "tabs.home" },
  { path: "/center", OutlineIcon: CenterOutlineIcon, FilledIcon: CenterFilledIcon, key: "tabs.center" },
  { path: "/shop", OutlineIcon: ShopOutlineIcon, FilledIcon: ShopFilledIcon, key: "tabs.store" },
  { path: "/profile", OutlineIcon: ProfileOutlineIcon, FilledIcon: ProfileFilledIcon, key: "tabs.profile", useAvatar: true },
];

const AI_PATH = "/ai";

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
      OutlineIcon: React.ComponentType<{ className?: string }>;
      FilledIcon: React.ComponentType<{ className?: string }>;
      key: string;
      useAvatar?: boolean;
    },
    isActive: boolean
  ) => {
    const showAvatar = tab.useAvatar && user?.avatar;
    const Icon = isActive ? tab.FilledIcon : tab.OutlineIcon;

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
              {user?.fullName?.slice(0, 1)?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <motion.div
            animate={{ scale: isActive ? 1.05 : 1 }}
            transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center"
          >
            <Icon className="h-6 w-6 text-current" />
          </motion.div>
        )}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 shrink-0 border-t border-border dark:border-0 dark:border-transparent bg-background">
      <div className="flex items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.slice(0, 2).map((tab) => renderTab(tab, location.pathname === tab.path))}

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

        {TABS.slice(2).map((tab) => renderTab(tab, location.pathname === tab.path))}
      </div>
    </nav>
  );
};

export default BottomNav;
