export const NOTIFICATIONS_STORAGE_KEY = "reformator_bio_notifications";
const NOTIFICATIONS_ENABLED_KEY = "notifications_enabled";

export type NotificationType = "nutrition" | "ai" | "clinic" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: number;
  read: boolean;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getNotifications(): Notification[] {
  const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  const list = safeParse<Notification[]>(raw, []);
  return Array.isArray(list) ? list : [];
}

export function setNotifications(list: Notification[]): void {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
}

export function getNotificationsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
  } catch {
    // ignore
  }
}

export function getMockNotifications(): Notification[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return [
    {
      id: "mock-nutrition-1",
      type: "nutrition",
      title: "Питание",
      message: "Сегодня вы можете потребить ещё 450 ккал.",
      date: now - 2 * 60 * 60 * 1000,
      read: false,
    },
    {
      id: "mock-ai-1",
      type: "ai",
      title: "Рекомендация",
      message: "Рекомендуется увеличить потребление белка.",
      date: now - 5 * 60 * 60 * 1000,
      read: false,
    },
    {
      id: "mock-clinic-1",
      type: "clinic",
      title: "Запись",
      message: "Запись в Reformator: 14:30 — Капельница Recovery.",
      date: now - 1 * day,
      read: true,
    },
    {
      id: "mock-system-1",
      type: "system",
      title: "Обновление",
      message: "Обновлены рекомендации по здоровью.",
      date: now - 2 * day,
      read: true,
    },
  ];
}

export function seedMockIfEmpty(): void {
  if (!getNotificationsEnabled()) return;
  const list = getNotifications();
  if (list.length === 0) {
    setNotifications(getMockNotifications());
  }
}
