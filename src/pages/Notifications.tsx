import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import {
  getNotifications,
  setNotifications,
  seedMockIfEmpty,
  type Notification,
} from "@/lib/notifications";
import NotificationPanel from "@/components/notifications/NotificationPanel";

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotificationsState] = useState<Notification[]>(() =>
    getNotifications()
  );

  useEffect(() => {
    seedMockIfEmpty();
    setNotificationsState(getNotifications());
  }, []);

  const handleMarkRead = (id: string) => {
    const next = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotificationsState(next);
    setNotifications(next);
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("notifications.ariaBack")}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">{t("notifications.title")}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-24">
        <NotificationPanel
          notifications={notifications}
          onMarkRead={handleMarkRead}
          hideTitle
          useExternalScroll
        />
      </div>
    </div>
  );
}
