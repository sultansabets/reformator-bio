import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/notifications";

type NotificationPanelProps = {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Hide the title (e.g. when page has its own header) */
  hideTitle?: boolean;
  /** When true, content is not scrollable (parent page scrolls) */
  useExternalScroll?: boolean;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function NotificationPanel({
  notifications,
  onMarkRead,
  scrollContainerRef,
  hideTitle,
  useExternalScroll,
}: NotificationPanelProps) {
  const { t } = useTranslation();
  const sorted = [...notifications].sort((a, b) => b.date - a.date);

  return (
    <>
      {!hideTitle && (
        <div className="shrink-0 px-6 pt-2 pb-2">
          <h2 className="text-lg font-semibold text-foreground">{t("notifications.title")}</h2>
        </div>
      )}
      <div
        ref={scrollContainerRef}
        className={cn(
          "px-6 pb-6",
          useExternalScroll ? "flex flex-col" : "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
        )}
      >
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("notifications.noNew")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sorted.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    n.read
                      ? "border-border bg-transparent text-muted-foreground"
                      : "border-border bg-muted/50 font-medium text-foreground"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t(`notifications.types.${n.type}`)}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(n.date)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
