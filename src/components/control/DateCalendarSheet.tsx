import React from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent, DrawerHeader } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";

interface DateCalendarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  /** Optional: dates that have data (workouts, nutrition) - will be visually marked */
  datesWithData?: string[];
}

function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toISO(d: Date): string {
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
}

export function DateCalendarSheet({
  open,
  onOpenChange,
  selectedDate,
  onSelectDate,
  datesWithData = [],
}: DateCalendarSheetProps) {
  const { t } = useTranslation();
  const today = toISO(new Date());

  const disabledDays = { after: new Date() };

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    const iso = toISO(d);
    if (iso > today) return;
    onSelectDate(iso);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col bg-card">
        <DrawerHeader className="shrink-0 border-b border-border px-5 pb-4 pt-4 text-left">
          <h2 className="text-lg font-semibold text-foreground">{t("center.datePickTitle")}</h2>
        </DrawerHeader>
        <div className="flex flex-1 justify-center overflow-y-auto p-4">
          <Calendar
            mode="single"
            selected={toDate(selectedDate)}
            onSelect={handleSelect}
            disabled={disabledDays}
            className="rounded-lg border-0 bg-transparent"
            classNames={{
              day_today: "bg-primary/20 text-primary font-semibold",
              day_selected: "bg-primary text-primary-foreground",
              day_disabled: "opacity-40",
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
