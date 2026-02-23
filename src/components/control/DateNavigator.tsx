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
      <div className="flex items-center justify-center gap-2 py-3">
        <button
          type="button"
          onClick={goPrev}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          className="min-w-[140px] rounded-lg border border-border bg-card px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
        >
          {label}
        </button>

        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
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
