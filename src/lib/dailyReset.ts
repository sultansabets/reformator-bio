/**
 * Timezone-safe daily reset: if stored date !== today (local),
 * save current day snapshot to history and reset daily counters.
 * History is preserved; only "current" day data is reset.
 * When userId is provided, uses user_{id}_* keys; otherwise legacy keys.
 */

function getKeys(userId: string | undefined) {
  if (userId) {
    return {
      NUTRITION_KEY: `user_${userId}_nutrition`,
      NUTRITION_HISTORY_KEY: `user_${userId}_nutrition_history`,
      WATER_KEY: `user_${userId}_water`,
      WATER_HISTORY_KEY: `user_${userId}_water_history`,
      LAST_RESET_DATE_KEY: `user_${userId}_last_reset_date`,
    };
  }
  return {
    NUTRITION_KEY: "reformator_bio_nutrition",
    NUTRITION_HISTORY_KEY: "reformator_bio_nutrition_history",
    WATER_KEY: "reformator_bio_water",
    WATER_HISTORY_KEY: "reformator_bio_water_history",
    LAST_RESET_DATE_KEY: "reformator_bio_last_reset_date",
  };
}

function getTodayDateString(): string {
  return new Date().toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
}

function appendToHistory<T>(key: string, snapshot: T, maxItems = 100): void {
  try {
    const raw = localStorage.getItem(key);
    const list: T[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return;
    const next = [snapshot, ...list].slice(0, maxItems);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function ensureDailyReset(userId?: string): void {
  const keys = getKeys(userId);
  const today = getTodayDateString();
  const lastReset = localStorage.getItem(keys.LAST_RESET_DATE_KEY);
  if (lastReset === today) return;

  // Save yesterday's nutrition to history if we have data for a previous day
  try {
    const nutRaw = localStorage.getItem(keys.NUTRITION_KEY);
    if (nutRaw) {
      const parsed = JSON.parse(nutRaw) as { date?: string; breakfast?: unknown[]; lunch?: unknown[]; dinner?: unknown[]; snacks?: unknown[] };
      if (parsed.date && parsed.date !== today) {
        const hasData = (parsed.breakfast?.length ?? 0) + (parsed.lunch?.length ?? 0) + (parsed.dinner?.length ?? 0) + (parsed.snacks?.length ?? 0) > 0;
        if (hasData) {
          appendToHistory(keys.NUTRITION_HISTORY_KEY, { date: parsed.date, ...parsed });
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    const waterRaw = localStorage.getItem(keys.WATER_KEY);
    if (waterRaw) {
      const parsed = JSON.parse(waterRaw) as { lastUpdatedDate?: string; current?: number; goal?: number };
      if (parsed.lastUpdatedDate && parsed.lastUpdatedDate !== today && (Number(parsed.current) || 0) > 0) {
        appendToHistory(keys.WATER_HISTORY_KEY, {
          date: parsed.lastUpdatedDate,
          current: Number(parsed.current) || 0,
          goal: Number(parsed.goal) || 2500,
        });
      }
    }
  } catch {
    // ignore
  }

  // Workout history is already per-entry with dates; no need to "reset", just ensure we don't delete it.
  // Optionally save a daily metrics snapshot if we had a previous day (we'd need to compute it - skip for simplicity to avoid coupling).

  // Reset current day data for nutrition and water
  try {
    const nutRaw = localStorage.getItem(keys.NUTRITION_KEY);
    if (nutRaw) {
      const parsed = JSON.parse(nutRaw) as { date?: string };
      if (parsed.date !== today) {
        localStorage.setItem(
          keys.NUTRITION_KEY,
          JSON.stringify({
            date: today,
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: [],
          })
        );
      }
    }
  } catch {
    // ignore
  }

  try {
    const waterRaw = localStorage.getItem(keys.WATER_KEY);
    if (waterRaw) {
      const parsed = JSON.parse(waterRaw) as { lastUpdatedDate?: string; goal?: number };
      if (parsed.lastUpdatedDate !== today) {
        localStorage.setItem(
          keys.WATER_KEY,
          JSON.stringify({
            current: 0,
            goal: Number(parsed?.goal) || 2500,
            lastUpdatedDate: today,
          })
        );
      }
    }
  } catch {
    // ignore
  }

  localStorage.setItem(keys.LAST_RESET_DATE_KEY, today);
}
