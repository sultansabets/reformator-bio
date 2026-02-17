import { Home, Zap, Brain, ShoppingBag, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const tabs = [
  { path: "/control", icon: Home, ariaLabel: "Главная" },
  { path: "/center", icon: Zap, ariaLabel: "Центр" },
  { path: "/ai", icon: Brain, ariaLabel: "ИИ" },
  { path: "/shop", icon: ShoppingBag, ariaLabel: "Магазин" },
  { path: "/profile", icon: User, ariaLabel: "Профиль", useAvatar: true },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
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
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
