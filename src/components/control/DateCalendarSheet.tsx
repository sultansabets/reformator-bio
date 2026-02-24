import React from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
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
      <DrawerContent className="max-h-[85vh] flex flex-col border-0 bg-[#141414] rounded-t-[24px]">
        <DrawerHeader className="shrink-0 px-5 pb-3 pt-2 flex flex-row items-center justify-between">
          <h2 className="text-base font-medium text-foreground">{t("center.datePickTitle")}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors -mr-2"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </DrawerHeader>
        <div className="flex flex-1 justify-center overflow-y-auto px-5 pb-6">
          <Calendar
            mode="single"
            selected={toDate(selectedDate)}
            onSelect={handleSelect}
            disabled={disabledDays}
            className="rounded-none border-0 bg-transparent p-0 text-foreground"
            classNames={{
              day_today: "bg-primary/25 text-foreground font-semibold",
              day_selected: "bg-primary text-primary-foreground",
              day_disabled: "opacity-30 cursor-not-allowed",
              nav_button: "hover:opacity-80",
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
