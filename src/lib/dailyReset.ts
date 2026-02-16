/**
 * Timezone-safe daily reset: if stored date !== today (local),
 * save current day snapshot to history and reset daily counters.
 * History is preserved; only "current" day data is reset.
 */

const NUTRITION_KEY = "reformator_bio_nutrition";
const NUTRITION_HISTORY_KEY = "reformator_bio_nutrition_history";
const WATER_KEY = "reformator_bio_water";
const WATER_HISTORY_KEY = "reformator_bio_water_history";
const WORKOUT_HISTORY_KEY = "reformator_bio_workout_history";
const METRICS_HISTORY_KEY = "reformator_bio_metrics_history";
const LAST_RESET_DATE_KEY = "reformator_bio_last_reset_date";

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

export function ensureDailyReset(): void {
  const today = getTodayDateString();
  const lastReset = localStorage.getItem(LAST_RESET_DATE_KEY);
  if (lastReset === today) return;

  // Save yesterday's nutrition to history if we have data for a previous day
  try {
    const nutRaw = localStorage.getItem(NUTRITION_KEY);
    if (nutRaw) {
      const parsed = JSON.parse(nutRaw) as { date?: string; breakfast?: unknown[]; lunch?: unknown[]; dinner?: unknown[]; snacks?: unknown[] };
      if (parsed.date && parsed.date !== today) {
        const hasData = (parsed.breakfast?.length ?? 0) + (parsed.lunch?.length ?? 0) + (parsed.dinner?.length ?? 0) + (parsed.snacks?.length ?? 0) > 0;
        if (hasData) {
          appendToHistory(NUTRITION_HISTORY_KEY, { date: parsed.date, ...parsed });
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    const waterRaw = localStorage.getItem(WATER_KEY);
    if (waterRaw) {
      const parsed = JSON.parse(waterRaw) as { lastUpdatedDate?: string; current?: number; goal?: number };
      if (parsed.lastUpdatedDate && parsed.lastUpdatedDate !== today && (Number(parsed.current) || 0) > 0) {
        appendToHistory(WATER_HISTORY_KEY, {
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
    const nutRaw = localStorage.getItem(NUTRITION_KEY);
    if (nutRaw) {
      const parsed = JSON.parse(nutRaw) as { date?: string };
      if (parsed.date !== today) {
        localStorage.setItem(
          NUTRITION_KEY,
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
    const waterRaw = localStorage.getItem(WATER_KEY);
    if (waterRaw) {
      const parsed = JSON.parse(waterRaw) as { lastUpdatedDate?: string; goal?: number };
      if (parsed.lastUpdatedDate !== today) {
        localStorage.setItem(
          WATER_KEY,
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

  localStorage.setItem(LAST_RESET_DATE_KEY, today);
}
