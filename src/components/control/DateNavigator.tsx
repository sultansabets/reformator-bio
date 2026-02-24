import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDateStore } from "@/store/dateStore";
import { formatDateShort } from "@/lib/dateFormat";
import { DateCalendarSheet } from "./DateCalendarSheet";

function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
}

export function DateNavigator() {
  const { t } = useTranslation();
  const { selectedDate, setSelectedDate, goPrev, goNext, canGoNext } = useDateStore();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const today = getTodayISO();
  const isToday = selectedDate === today;

  const label = isToday ? t("center.dateToday") : formatDateShort(selectedDate);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setCalendarOpen(false);
  };

  return (
    <>
      <div className="flex w-fit max-w-full items-center justify-center gap-4 py-2">
        <button
          type="button"
          onClick={goPrev}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground/80 transition-opacity hover:opacity-80 active:opacity-70 outline-none focus:outline-none focus-visible:ring-0"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="min-w-[120px] px-4 py-2 text-center text-sm font-medium text-foreground transition-opacity hover:opacity-80 active:opacity-70 outline-none focus:outline-none focus-visible:ring-0"
        >
          {label}
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext()}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-foreground/80 transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-40 outline-none focus:outline-none focus-visible:ring-0 disabled:hover:opacity-40"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <DateCalendarSheet
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
      />
    </>
  );
}
