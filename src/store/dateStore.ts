import { create } from "zustand";

/**
 * Store for selected date on the main page (ControlCenter).
 * Used for date navigation: Energy, Sleep, Load, Adaptation, charts.
 */

function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
}

type DateState = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  goPrev: () => void;
  goNext: () => void;
  canGoNext: () => boolean;
};

export const useDateStore = create<DateState>((set, get) => ({
  selectedDate: getTodayISO(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  goPrev: () => {
    const d = new Date(get().selectedDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    set({ selectedDate: d.toLocaleDateString("en-CA").replace(/\//g, "-") });
  },
  goNext: () => {
    const today = getTodayISO();
    const current = get().selectedDate;
    if (current >= today) return;
    const d = new Date(current + "T12:00:00");
    d.setDate(d.getDate() + 1);
    const next = d.toLocaleDateString("en-CA").replace(/\//g, "-");
    set({ selectedDate: next > today ? today : next });
  },
  canGoNext: () => get().selectedDate < getTodayISO(),
}));
