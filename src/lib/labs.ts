export const LABS_STORAGE_KEY = "reformator_bio_labs";

export interface LabEntry {
  date: string;
  testosterone: number;
  cortisol?: number;
  vitaminD?: number;
  hemoglobin?: number;
  other?: Record<string, number>;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getLabs(): LabEntry[] {
  const raw = localStorage.getItem(LABS_STORAGE_KEY);
  const list = safeParse<LabEntry[]>(raw, []);
  return Array.isArray(list) ? list : [];
}

export function setLabs(entries: LabEntry[]): void {
  localStorage.setItem(LABS_STORAGE_KEY, JSON.stringify(entries));
}

export function getLatestLab(): LabEntry | null {
  const labs = getLabs();
  if (labs.length === 0) return null;
  const sorted = [...labs].sort((a, b) => (b.date > a.date ? 1 : -1));
  return sorted[0] ?? null;
}

/** ng/dL reference: low < 300, normal 300–1000, high > 1000 (simplified) */
export function getTestosteroneStatus(value: number): "low" | "normal" | "high" {
  if (value < 300) return "low";
  if (value > 1000) return "high";
  return "normal";
}
